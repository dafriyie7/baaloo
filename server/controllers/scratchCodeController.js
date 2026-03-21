import ScratchCode from "../models/ScratchCode.js";
import Batch from "../models/Batch.js";
import { v4 as uuid } from "uuid";
import QRCode from "qrcode";
import { encrypt, decrypt, hashForLookup } from "../lib/encryption.js";
import {
	allocateCountsFromPercentages,
	computePools,
	computeTierPrizes,
	maxFrequencyNine,
	M_TIERS,
} from "../lib/scratchTierMath.js";
import {
	generateJackpotSymbols,
	generateLoserSymbols,
	generateMKSymbols,
} from "../lib/symbolGenerator.js";
import {
	allocateNextBatchNumber,
	isValidManualBatchNumber,
} from "../lib/generateBatchNumber.js";

const ALLOWED_TIERS = new Set(["loser", "jackpot", ...M_TIERS]);
const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function shuffleInPlace(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

function validateTierDistribution(tierDistribution, totalCodes) {
	if (!tierDistribution || typeof tierDistribution !== "object") {
		throw new Error("tierDistribution must be an object of tier → percentage");
	}
	const keys = Object.keys(tierDistribution);
	if (keys.length === 0) throw new Error("tierDistribution is empty");

	for (const k of keys) {
		if (!ALLOWED_TIERS.has(k)) {
			throw new Error(`Unknown tier key "${k}". Allowed: ${[...ALLOWED_TIERS].join(", ")}`);
		}
		const p = Number(tierDistribution[k]);
		if (!Number.isFinite(p) || p < 0) {
			throw new Error(`Invalid percentage for tier ${k}`);
		}
	}

	const counts = allocateCountsFromPercentages(tierDistribution, totalCodes);
	const sumCounts = Object.values(counts).reduce((a, b) => a + b, 0);
	if (sumCounts !== totalCodes) {
		throw new Error("Internal error: tier counts do not match totalCodes");
	}
	return counts;
}

function buildPlans(counts, jackpotPrizeEach, tierPrizes) {
	const plans = [];
	const add = (n, plan) => {
		for (let i = 0; i < n; i++) plans.push({ ...plan });
	};

	add(counts.loser || 0, {
		tier: "loser",
		prizeAmount: 0,
		isWinner: false,
		maxMatchCount: 0,
	});
	add(counts.jackpot || 0, {
		tier: "jackpot",
		prizeAmount: jackpotPrizeEach,
		isWinner: true,
		maxMatchCount: 9,
	});
	for (const t of M_TIERS) {
		const n = counts[t] || 0;
		if (n <= 0) continue;
		const k = parseInt(t.slice(1), 10);
		add(n, {
			tier: t,
			prizeAmount: tierPrizes[t] || 0,
			isWinner: true,
			maxMatchCount: k,
		});
	}
	shuffleInPlace(plans);
	return plans;
}

function symbolsForPlan(plan, alphabet) {
	if (plan.tier === "jackpot") return generateJackpotSymbols(alphabet);
	if (plan.tier === "loser") return generateLoserSymbols(alphabet);
	return generateMKSymbols(plan.maxMatchCount, alphabet);
}

export const generateBatch = async (req, res) => {
	try {
		const {
			batchNumber,
			totalCodes: totalCodesRaw,
			costPerCode: costRaw,
			giveawayPercentage: gRaw,
			jackpotGiveawayPercentage: jRaw,
			tierDistribution,
			prizeTierWeights,
			symbolSet,
		} = req.body;

		const totalCodes = parseInt(totalCodesRaw, 10);
		const costPerCode = Number(costRaw);
		const giveawayPercentage = Number(gRaw);
		const jackpotGiveawayPercentage = Number(jRaw);

		if (
			!Number.isFinite(totalCodes) ||
			totalCodes < 1 ||
			!Number.isFinite(costPerCode) ||
			costPerCode < 0 ||
			!Number.isFinite(giveawayPercentage) ||
			giveawayPercentage < 0 ||
			giveawayPercentage > 100 ||
			!Number.isFinite(jackpotGiveawayPercentage) ||
			jackpotGiveawayPercentage < 0 ||
			jackpotGiveawayPercentage > 100
		) {
			return res.status(400).json({
				success: false,
				message:
					"Invalid totalCodes, costPerCode, giveawayPercentage, or jackpotGiveawayPercentage.",
			});
		}

		const trimmedBn =
			typeof batchNumber === "string" ? batchNumber.trim() : "";
		let resolvedBatchNumber;
		if (trimmedBn) {
			const upper = trimmedBn.toUpperCase();
			if (!isValidManualBatchNumber(upper)) {
				return res.status(400).json({
					success: false,
					message:
						'Optional batchNumber must look like PREFIX-yyyyMM-NNNN (e.g. BAA-202612-0001), PREFIX 2–4 A–Z/0–9.',
				});
			}
			const exists = await Batch.findOne({ batchNumber: upper });
			if (exists) {
				return res.status(400).json({
					success: false,
					message: `Batch number "${upper}" already exists.`,
				});
			}
			resolvedBatchNumber = upper;
		} else {
			resolvedBatchNumber = await allocateNextBatchNumber();
		}

		if (!tierDistribution || !prizeTierWeights) {
			return res.status(400).json({
				success: false,
				message: "tierDistribution and prizeTierWeights are required.",
			});
		}

		const alphabet =
			typeof symbolSet === "string" && symbolSet.length >= 8
				? symbolSet
				: DEFAULT_ALPHABET;

		const counts = validateTierDistribution(tierDistribution, totalCodes);

		const { totalRevenue, totalPrizePool, jackpotPool, otherPrizePool } =
			computePools(
				totalCodes,
				costPerCode,
				giveawayPercentage,
				jackpotGiveawayPercentage
			);

		const { jackpotPrizeEach, tierPrizes } = computeTierPrizes(
			counts,
			prizeTierWeights,
			otherPrizePool,
			jackpotPool
		);

		const plans = buildPlans(counts, jackpotPrizeEach, tierPrizes);

		const batch = await Batch.create({
			batchNumber: resolvedBatchNumber,
			pattern: [],
			mechanicVersion: 2,
			costPerCode,
			totalCodes,
			giveawayPercentage,
			jackpotGiveawayPercentage,
			totalRevenue,
			totalPrizePool,
			jackpotPool,
			otherPrizePool,
			totalPrizeBudget: totalPrizePool,
			tierDistributionSnapshot: tierDistribution,
			prizeTierWeightsSnapshot: prizeTierWeights,
			tierCountsSnapshot: counts,
			jackpotPrizeEach,
			winningPrize: jackpotPrizeEach,
			symbolAlphabet: alphabet,
		});

		const docs = [];
		for (const plan of plans) {
			const shortCode = uuid().split("-")[0].toUpperCase();
			const encryptedCode = encrypt(shortCode);
			const lookupHash = hashForLookup(shortCode);
			const symbols = symbolsForPlan(plan, alphabet);
			const maxMatch = maxFrequencyNine(symbols);

			docs.push({
				code: encryptedCode,
				lookupHash,
				batchNumber: batch._id,
				symbols,
				patternMatch: [...symbols],
				tier: plan.tier,
				maxMatchCount: maxMatch,
				prizeAmount: plan.prizeAmount,
				isWinner: plan.isWinner,
				isUsed: false,
			});
		}

		await ScratchCode.insertMany(docs);

		return res.json({
			success: true,
			message: "Batch created successfully",
			batchNumber: resolvedBatchNumber,
			totalCodes,
			totalRevenue,
			totalPrizePool,
			jackpotPool,
			otherPrizePool,
			jackpotPrizeEach,
			tierCounts: counts,
			tierPrizes,
		});
	} catch (error) {
		console.error(error);
		const msg = error.message || "Server error";
		const badRequest =
			/tier|pool|weight|percentage|jackpot|alphabet|Unknown tier|Invalid/i.test(
				msg
			);
		return res.status(badRequest ? 400 : 500).json({
			success: false,
			message: msg,
		});
	}
};

export const redeemScratchCode = async (req, res) => {
	try {
		const { scratchCode } = req.body;

		const lookupHash = hashForLookup(String(scratchCode).trim());

		const code = await ScratchCode.findOne({ lookupHash });

		if (!code) {
			return res
				.status(404)
				.json({ success: false, message: "Invalid scratch code." });
		}

		if (code.isUsed) {
			return res.status(400).json({
				success: false,
				message: "This scratch code has already been used.",
			});
		}

		const won = code.isWinner === true;
		return res.status(200).json({
			success: true,
			prize: won,
			message: won
				? "Congratulations! You've won!"
				: "Sorry, not a winner this time.",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const getAllScratchCodes = async (req, res) => {
	try {
		const { selectedBatch } = req.query;
		const { origin } = req.headers;

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;

		const batches = await Batch.find();

		if (batches.length === 0 && !selectedBatch) {
			return res.status(200).json({
				success: true,
				data: {
					withQRCodes: [],
					batches: [],
					totalPages: 0,
					currentPage: 1,
				},
			});
		}

		const queryBatch =
			selectedBatch || (batches.length > 0 ? batches[0]._id : null);
		const query = queryBatch ? { batchNumber: queryBatch } : {};

		const codes = await ScratchCode.find(query)
			.limit(limit)
			.skip((page - 1) * limit)
			.lean();

		const totalCodes = await ScratchCode.countDocuments(query);

		const withQRCodes = await Promise.all(
			codes.map(async (c) => {
				let plainCode;
				try {
					plainCode = decrypt(c.code);
				} catch {
					plainCode = "[DECRYPTION_FAILED]";
				}

				const scanUrl = `${origin}/scratch/${plainCode}`;
				const qrImage = await QRCode.toDataURL(scanUrl);

				const displaySymbols =
					c.symbols && c.symbols.length === 9
						? c.symbols
						: (c.patternMatch || []).join("") || "";

				return {
					...c,
					code: plainCode,
					qrImage,
					displaySymbols,
				};
			})
		);

		return res.status(200).json({
			success: true,
			data: {
				withQRCodes,
				batches,
				totalPages: Math.ceil(totalCodes / limit),
				currentPage: page,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};
