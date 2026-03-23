import crypto from "crypto";
import mongoose from "mongoose";
import ScratchCode from "../models/ScratchCode.js";
import Batch from "../models/Batch.js";
import QRCode from "qrcode";
import {
	encrypt,
	decrypt,
	hashForLookup,
	normalizeScratchCodeForLookup,
} from "../lib/encryption.js";
import {
	JACKPOT_MAX_MATCH_COUNT,
	maxSymbolFrequency,
	R_STAKE_TIER,
	R_WIN_TIERS,
	SCRATCH_SYMBOL_COUNT,
} from "../lib/scratchTierMath.js";
import {
	generateJackpotSymbols,
	generateLoserSymbols,
	generateRepeatTierSymbols,
} from "../lib/symbolGenerator.js";
import {
	allocateNextBatchNumber,
	isValidManualBatchNumber,
} from "../lib/generateBatchNumber.js";

const ALLOWED_TIERS = new Set([
	"loser",
	"jackpot",
	R_STAKE_TIER,
	...R_WIN_TIERS,
]);
const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * 20 hex chars (80-bit). Strong enough for very large batches; much easier to read than 128-bit UUID hex.
 * Legacy rows may still use 32-char codes from older generation.
 */
function newScratchShortCode() {
	return crypto.randomBytes(10).toString("hex").toUpperCase();
}

function roundMoney(n) {
	return Math.round(Number(n) * 100) / 100;
}

/** Jackpot ticket prize is floored to this step (e.g. 12,000 → 10,000). */
const JACKPOT_PRIZE_ROUND_STEP = 10000;

function floorJackpotPrizeEach(amount) {
	const x = Number(amount);
	if (!Number.isFinite(x) || x < 0) return 0;
	return Math.floor(x / JACKPOT_PRIZE_ROUND_STEP) * JACKPOT_PRIZE_ROUND_STEP;
}

const LOG_GEN_STRUCTURED = "[scratch generate-structured]";

function structuredGenFail(res, status, message) {
	console.error(LOG_GEN_STRUCTURED, "client error", { status, message });
	return res.status(status).json({ success: false, message });
}

function shuffleInPlace(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
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
	add(counts.r1 || 0, {
		tier: R_STAKE_TIER,
		prizeAmount: tierPrizes[R_STAKE_TIER] || 0,
		isWinner: true,
		maxMatchCount: 0,
	});
	add(counts.jackpot || 0, {
		tier: "jackpot",
		prizeAmount: jackpotPrizeEach,
		isWinner: true,
		maxMatchCount: JACKPOT_MAX_MATCH_COUNT,
	});
	for (const t of R_WIN_TIERS) {
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
	if (plan.tier === "loser" || plan.tier === R_STAKE_TIER) {
		return generateLoserSymbols(alphabet);
	}
	return generateRepeatTierSymbols(plan.maxMatchCount, alphabet);
}

/**
 * Structured batch: jackpot count (≥1), R-tier rows = % of giveaway + fixed prize each
 * (r1 uses stake = costPerCode). Counts = floor(budget÷prize); leftovers → margin.
 * Jackpot share = 100% − sum(R-tier %).
 */
export const generateBatchStructured = async (req, res) => {
	try {
		const {
			batchNumber,
			totalCodes: totalCodesRaw,
			costPerCode: costRaw,
			giveawayPercentage: gRaw,
			jackpotCount: jackpotCountRaw,
			rTierPayouts,
			symbolSet,
		} = req.body;

		const totalCodes = parseInt(totalCodesRaw, 10);
		const costPerCode = Number(costRaw);
		const giveawayPercentage = Number(gRaw);
		const jackpotCount = parseInt(String(jackpotCountRaw), 10);

		if (!Number.isFinite(totalCodes) || totalCodes < 1) {
			return structuredGenFail(
				res,
				400,
				"totalCodes must be a positive integer."
			);
		}
		if (!Number.isFinite(costPerCode) || costPerCode < 0) {
			return structuredGenFail(
				res,
				400,
				"costPerCode must be a non-negative number."
			);
		}
		if (
			!Number.isFinite(giveawayPercentage) ||
			giveawayPercentage < 0 ||
			giveawayPercentage > 100
		) {
			return structuredGenFail(
				res,
				400,
				"giveawayPercentage must be between 0 and 100."
			);
		}
		if (!Number.isFinite(jackpotCount) || jackpotCount < 1) {
			return structuredGenFail(
				res,
				400,
				"jackpotCount must be an integer ≥ 1."
			);
		}

		if (!Array.isArray(rTierPayouts)) {
			return structuredGenFail(
				res,
				400,
				"rTierPayouts must be an array of { tier, giveawaySharePct, prizePerWinner? } (r1 prize is always costPerCode)."
			);
		}

		const trimmedBn =
			typeof batchNumber === "string" ? batchNumber.trim() : "";
		let resolvedBatchNumber;
		if (trimmedBn) {
			const upper = trimmedBn.toUpperCase();
			if (!isValidManualBatchNumber(upper)) {
				return structuredGenFail(
					res,
					400,
					"Optional batchNumber must look like CC-YYMM-PPP (e.g. AA-2603-010): two-letter counter (AA–ZZ), year + month, 3-digit rounded price per code."
				);
			}
			const exists = await Batch.findOne({ batchNumber: upper });
			if (exists) {
				return structuredGenFail(
					res,
					400,
					`Batch number "${upper}" already exists.`
				);
			}
			resolvedBatchNumber = upper;
		} else {
			resolvedBatchNumber = await allocateNextBatchNumber(
				new Date(),
				costPerCode
			);
		}

		const totalRevenue = roundMoney(totalCodes * costPerCode);
		const totalPrizePool = roundMoney(
			totalRevenue * (giveawayPercentage / 100)
		);

		const seenTiers = new Set();
		let sumRTierShare = 0;
		const payoutRows = [];
		const validStructuredRTier = /^(r1|r3|r5|r7)$/;

		for (const row of rTierPayouts) {
			const tier = String(row?.tier ?? "").toLowerCase();
			if (!validStructuredRTier.test(tier)) {
				return structuredGenFail(
					res,
					400,
					`Invalid tier "${row?.tier}". Use r1 (stake back) or r3, r5, or r7 (repetition tiers).`
				);
			}
			if (seenTiers.has(tier)) {
				return structuredGenFail(
					res,
					400,
					`Duplicate tier "${tier}" in rTierPayouts.`
				);
			}
			seenTiers.add(tier);

			const pct = Number(row.giveawaySharePct);
			const prize = Number(row.prizePerWinner);
			if (!Number.isFinite(pct) || pct < 0) {
				return structuredGenFail(
					res,
					400,
					`${tier}: giveawaySharePct must be a non-negative number.`
				);
			}
			if (pct > 0) {
				if (tier === R_STAKE_TIER) {
					if (!Number.isFinite(costPerCode) || costPerCode <= 0) {
						return structuredGenFail(
							res,
							400,
							"r1 (stake back) requires costPerCode > 0."
						);
					}
					const stakePrice = roundMoney(costPerCode);
					sumRTierShare += pct;
					payoutRows.push({
						tier,
						giveawaySharePct: pct,
						prizePerWinner: stakePrice,
					});
				} else {
					if (!Number.isFinite(prize) || prize <= 0) {
						return structuredGenFail(
							res,
							400,
							`${tier}: prizePerWinner must be > 0 when giveawaySharePct > 0.`
						);
					}
					sumRTierShare += pct;
					payoutRows.push({
						tier,
						giveawaySharePct: pct,
						prizePerWinner: prize,
					});
				}
			}
		}

		if (sumRTierShare > 100.0001) {
			return structuredGenFail(
				res,
				400,
				`Sum of R-tier giveaway shares is ${roundMoney(sumRTierShare)}%; it cannot exceed 100%.`
			);
		}

		const jackpotGiveawayPercentage = roundMoney(100 - sumRTierShare);
		const jackpotPool = roundMoney(
			totalPrizePool * (jackpotGiveawayPercentage / 100)
		);

		const counts = { loser: 0, jackpot: jackpotCount, r1: 0 };
		const tierPrizes = {};
		for (const t of R_WIN_TIERS) {
			counts[t] = 0;
		}

		let marginRetainedFromPrizePool = 0;

		for (const row of payoutRows) {
			const budget = roundMoney(
				totalPrizePool * (row.giveawaySharePct / 100)
			);
			const price = roundMoney(row.prizePerWinner);
			const cnt = Math.floor(budget / price);
			const spent = roundMoney(cnt * price);
			const leftover = roundMoney(budget - spent);
			marginRetainedFromPrizePool = roundMoney(
				marginRetainedFromPrizePool + leftover
			);
			counts[row.tier] = cnt;
			tierPrizes[row.tier] = price;
		}

		const rawJackpotEach = roundMoney(jackpotPool / jackpotCount);
		const jackpotPrizeEach = roundMoney(floorJackpotPrizeEach(rawJackpotEach));
		if (jackpotPrizeEach <= 0) {
			return structuredGenFail(
				res,
				400,
				"Jackpot prize per ticket rounds down to zero (jackpot uses 10,000 steps). Increase giveaway or jackpot pool, or reduce jackpot winner count."
			);
		}
		const jackpotSpent = roundMoney(jackpotPrizeEach * jackpotCount);
		marginRetainedFromPrizePool = roundMoney(
			marginRetainedFromPrizePool + roundMoney(jackpotPool - jackpotSpent)
		);

		const rTickets =
			(counts.r1 || 0) +
			R_WIN_TIERS.reduce((s, t) => s + (counts[t] || 0), 0);
		const used = jackpotCount + rTickets;
		const loserCount = totalCodes - used;

		if (loserCount < 0) {
			return structuredGenFail(
				res,
				400,
				`Not enough codes: jackpot (${jackpotCount}) plus R tiers (${rTickets}) require ${used} codes, but totalCodes is ${totalCodes}. Reduce R-tier giveaway %, raise prize per winner, or increase totalCodes.`
			);
		}
		counts.loser = loserCount;

		const otherPrizePool = roundMoney(totalPrizePool - jackpotPool);

		const alphabet =
			typeof symbolSet === "string" && symbolSet.length >= SCRATCH_SYMBOL_COUNT
				? symbolSet
				: DEFAULT_ALPHABET;

		console.log(LOG_GEN_STRUCTURED, "inserting", {
			batchNumber: resolvedBatchNumber,
			totalCodes,
			jackpotCount,
			rTierPayoutRows: payoutRows.length,
			loserCount,
			marginRetainedFromPrizePool,
		});

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
			tierDistributionSnapshot: {
				structured: true,
				jackpotCount,
				rTierPayouts: payoutRows,
			},
			prizeTierWeightsSnapshot: tierPrizes,
			tierCountsSnapshot: counts,
			jackpotPrizeEach,
			winningPrize: jackpotPrizeEach,
			marginRetainedFromPrizePool,
			symbolAlphabet: alphabet,
		});

		const docs = [];
		for (const plan of plans) {
			const shortCode = newScratchShortCode();
			const encryptedCode = encrypt(shortCode);
			const lookupHash = hashForLookup(shortCode);
			const symbols = symbolsForPlan(plan, alphabet);
			const maxMatch = maxSymbolFrequency(symbols);

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

		console.log(LOG_GEN_STRUCTURED, "done", {
			batchNumber: resolvedBatchNumber,
			codesInserted: docs.length,
		});

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
			jackpotGiveawayPercentage,
			tierCounts: counts,
			tierPrizes,
			marginRetainedFromPrizePool,
		});
	} catch (error) {
		console.error(LOG_GEN_STRUCTURED, "exception", {
			name: error?.name,
			message: error?.message,
			code: error?.code,
			stack: error?.stack,
		});
		const msg = error.message || "Server error";
		const badRequest =
			/tier|pool|weight|percentage|jackpot|alphabet|Unknown tier|Invalid|Alphabet|r-tier|R-tier/i.test(
				msg
			);
		const status = badRequest ? 400 : 500;
		console.error(LOG_GEN_STRUCTURED, "responding", { status, message: msg });
		return res.status(status).json({
			success: false,
			message: msg,
		});
	}
};

/**
 * List all batches (newest first) with inserted code counts.
 */
export const listBatches = async (req, res) => {
	try {
		const batches = await Batch.find().sort({ createdAt: -1 }).lean();
		if (batches.length === 0) {
			return res.status(200).json({ success: true, data: [] });
		}
		const ids = batches.map((b) => b._id);
		const counts = await ScratchCode.aggregate([
			{ $match: { batchNumber: { $in: ids } } },
			{ $group: { _id: "$batchNumber", codesInserted: { $sum: 1 } } },
		]);
		const byId = new Map(
			counts.map((c) => [c._id.toString(), c.codesInserted])
		);
		const data = batches.map((b) => ({
			...b,
			codesInserted: byId.get(b._id.toString()) ?? 0,
		}));
		return res.status(200).json({ success: true, data });
	} catch (error) {
		console.error("[scratch batches list]", error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const redeemScratchCode = async (req, res) => {
	try {
		const { scratchCode } = req.body;

		const normalized = normalizeScratchCodeForLookup(scratchCode);
		if (!normalized) {
			return res
				.status(400)
				.json({ success: false, message: "Enter a valid redemption code." });
		}
		const lookupHash = hashForLookup(normalized);

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
		let message = "Sorry, not a winner this time.";
		if (won) {
			message =
				code.tier === R_STAKE_TIER
					? "You won your stake back."
					: "Congratulations! You've won!";
		}
		return res.status(200).json({
			success: true,
			prize: won,
			message,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const getAllScratchCodes = async (req, res) => {
	try {
		const { selectedBatch, status, outcome, tier, sort } = req.query;
		const { origin } = req.headers;

		const page = Math.max(1, parseInt(req.query.page, 10) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

		const batches = await Batch.find().lean();

		if (batches.length === 0 && !selectedBatch) {
			return res.status(200).json({
				success: true,
				data: {
					withQRCodes: [],
					batches: [],
					totalPages: 0,
					currentPage: 1,
					totalFiltered: 0,
					batchUsage: null,
				},
			});
		}

		const resolvedBatchId =
			selectedBatch && mongoose.Types.ObjectId.isValid(selectedBatch)
				? selectedBatch
				: batches.length > 0
					? batches[0]._id.toString()
					: null;

		if (!resolvedBatchId) {
			return res.status(200).json({
				success: true,
				data: {
					withQRCodes: [],
					batches,
					totalPages: 0,
					currentPage: 1,
					totalFiltered: 0,
					batchUsage: null,
				},
			});
		}

		const batchOid = new mongoose.Types.ObjectId(resolvedBatchId);

		const filter = { batchNumber: batchOid };
		if (status === "available") filter.isUsed = false;
		else if (status === "redeemed") filter.isUsed = true;
		if (outcome === "winner") filter.isWinner = true;
		else if (outcome === "loser") filter.isWinner = false;
		if (tier && tier !== "all" && ALLOWED_TIERS.has(tier)) {
			filter.tier = tier;
		}

		let sortSpec = { createdAt: -1 };
		if (sort === "oldest") sortSpec = { createdAt: 1 };
		else if (sort === "redeemed_newest") {
			sortSpec = { redeemedAt: -1, createdAt: -1 };
		}

		const totalFiltered = await ScratchCode.countDocuments(filter);

		const codes = await ScratchCode.find(filter)
			.sort(sortSpec)
			.limit(limit)
			.skip((page - 1) * limit)
			.lean();

		const baseMatch = { batchNumber: batchOid };
		const [
			totalInBatch,
			redeemedCount,
			availableCount,
			winnersInBatch,
			winnersRedeemed,
			losersRedeemed,
			tierAgg,
			tierPrizeAgg,
		] = await Promise.all([
			ScratchCode.countDocuments(baseMatch),
			ScratchCode.countDocuments({ ...baseMatch, isUsed: true }),
			ScratchCode.countDocuments({ ...baseMatch, isUsed: false }),
			ScratchCode.countDocuments({ ...baseMatch, isWinner: true }),
			ScratchCode.countDocuments({
				...baseMatch,
				isWinner: true,
				isUsed: true,
			}),
			ScratchCode.countDocuments({
				...baseMatch,
				isWinner: false,
				isUsed: true,
			}),
			ScratchCode.aggregate([
				{ $match: baseMatch },
				{ $group: { _id: "$tier", count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
			]),
			ScratchCode.aggregate([
				{ $match: baseMatch },
				{
					$group: {
						_id: "$tier",
						prizeAmount: { $max: "$prizeAmount" },
					},
				},
			]),
		]);

		const tierBreakdown = Object.fromEntries(
			tierAgg.map((row) => [row._id || "unknown", row.count])
		);

		const tierPrizeAmounts = Object.fromEntries(
			tierPrizeAgg.map((row) => [
				row._id || "unknown",
				Number(row.prizeAmount) || 0,
			])
		);

		const batchUsage = {
			totalCodes: totalInBatch,
			redeemedCount,
			availableCount,
			redemptionRate:
				totalInBatch > 0
					? Math.round((redeemedCount / totalInBatch) * 10000) / 100
					: 0,
			winnersInBatch,
			winnersRedeemed,
			losersRedeemed,
			tierBreakdown,
			tierPrizeAmounts,
		};

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
					c.symbols && c.symbols.length === SCRATCH_SYMBOL_COUNT
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

		const totalPages =
			totalFiltered > 0 ? Math.ceil(totalFiltered / limit) : 1;

		return res.status(200).json({
			success: true,
			data: {
				withQRCodes,
				batches,
				totalPages,
				currentPage: page,
				totalFiltered,
				batchUsage,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};
