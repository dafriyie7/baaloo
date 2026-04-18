import crypto from "crypto";
import Batch from "../models/Batch.js";
import ScratchCode from "../models/ScratchCode.js";
import Svg from "../models/Svg.js";
import {
	encrypt,
	hashForLookup,
} from "../lib/encryption.js";
import {
	allocateNextBatchNumber,
	isValidManualBatchNumber,
} from "../lib/generateBatchNumber.js";
import {
	buildPriceTagJackpotWinPanel,
	buildPriceTagLoserLikePanel,
	buildPriceTagTierWinPanel,
	panelMaxFrequency,
} from "../lib/priceTagPanels.js";

function parseOptionalSvgThemeType(raw) {
	if (raw == null || String(raw).trim() === "") return "";
	const s = String(raw).trim().toLowerCase();
	if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(s)) {
		throw new Error(
			"svgThemeType must be a lowercase slug (letters, digits, hyphens)."
		);
	}
	return s;
}

function newScratchShortCode() {
	return crypto.randomBytes(10).toString("hex").toUpperCase();
}

function roundMoney(n) {
	return Math.round(Number(n) * 100) / 100;
}

const RESERVED_SYMBOL_NAMES = new Set(["loser", "jackpot"]);

const LOG = "[scratch generate-price-tag]";

function fail(res, status, message) {
	console.error(LOG, "client error", { status, message });
	return res.status(status).json({ success: false, message });
}

function normalizeSymbolName(raw) {
	return String(raw ?? "")
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, "");
}

/**
 * @param {import('mongoose').LeanDocument<import('../models/Svg.js').default>[]} svgRows
 * @param {string[]} tierSymbols
 * @param {string} jackpotSymbol
 */
function buildRulePack(svgRows, tierSymbols, jackpotSymbol) {
	const themeTokens = [
		...new Set(
			svgRows.map((r) => String(r.name ?? "").trim()).filter(Boolean)
		),
	].sort();
	const winnerSet = new Set([...tierSymbols, jackpotSymbol]);
	const paidNonWinnerSet = new Set();
	const zeroPrizeSet = new Set();
	for (const r of svgRows) {
		const name = String(r.name ?? "").trim();
		if (!name) continue;
		const p = Number(r.prizeAmount) || 0;
		if (p === 0) zeroPrizeSet.add(name);
		else if (!winnerSet.has(name)) paidNonWinnerSet.add(name);
	}
	return {
		themeTokens,
		winnerSet,
		paidNonWinnerSet,
		zeroPrizeSet,
		jackpotSymbol,
	};
}

export async function generatePriceTagBatch(req, res) {
	try {
		const {
			batchNumber: batchNumberRaw,
			totalCodes: totalCodesRaw,
			costPerCode: costRaw,
			giveawayPercentage: gRaw,
			svgThemeType: svgThemeTypeRaw,
			cashbackGiveawayPct: cbRaw,
			jackpotSymbolName: jackpotRaw,
			tierPayouts,
		} = req.body;

		let svgThemeType = "";
		try {
			svgThemeType = parseOptionalSvgThemeType(svgThemeTypeRaw);
		} catch (e) {
			return fail(res, 400, e.message);
		}
		if (!svgThemeType) {
			return fail(res, 400, "svgThemeType is required for this mechanic.");
		}

		const totalCodes = parseInt(totalCodesRaw, 10);
		const costPerCode = Number(costRaw);
		const giveawayPercentage = Number(gRaw);
		const cashbackGiveawayPct = Number(cbRaw ?? 0);

		if (!Number.isFinite(totalCodes) || totalCodes < 1) {
			return fail(res, 400, "totalCodes must be a positive integer.");
		}
		if (!Number.isFinite(costPerCode) || costPerCode <= 0) {
			return fail(res, 400, "costPerCode must be > 0.");
		}
		if (
			!Number.isFinite(giveawayPercentage) ||
			giveawayPercentage < 0 ||
			giveawayPercentage > 100
		) {
			return fail(res, 400, "giveawayPercentage must be between 0 and 100.");
		}
		if (
			!Number.isFinite(cashbackGiveawayPct) ||
			cashbackGiveawayPct < 0
		) {
			return fail(res, 400, "cashbackGiveawayPct must be a non-negative number.");
		}

		if (!Array.isArray(tierPayouts) || tierPayouts.length === 0) {
			return fail(
				res,
				400,
				"tierPayouts must be a non-empty array of { symbolName, giveawaySharePct }."
			);
		}

		const jackpotSymbol = normalizeSymbolName(jackpotRaw);
		if (!jackpotSymbol || RESERVED_SYMBOL_NAMES.has(jackpotSymbol)) {
			return fail(
				res,
				400,
				`Invalid jackpotSymbolName (reserved or empty: ${[...RESERVED_SYMBOL_NAMES].join(", ")}).`
			);
		}

		const seenTierSymbols = new Set();
		const tierRows = [];
		let sumTierPct = 0;

		for (const row of tierPayouts) {
			const symbolName = normalizeSymbolName(row?.symbolName);
			if (!symbolName || RESERVED_SYMBOL_NAMES.has(symbolName)) {
				return fail(
					res,
					400,
					`Invalid tier symbol name "${row?.symbolName}".`
				);
			}
			if (symbolName === jackpotSymbol) {
				return fail(
					res,
					400,
					"Jackpot symbol cannot also be a 3× prize tier symbol."
				);
			}
			if (seenTierSymbols.has(symbolName)) {
				return fail(res, 400, `Duplicate tier symbol "${symbolName}".`);
			}
			seenTierSymbols.add(symbolName);

			const pct = Number(row.giveawaySharePct);
			if (!Number.isFinite(pct) || pct <= 0) {
				return fail(
					res,
					400,
					`Each tier needs giveawaySharePct > 0 (symbol ${symbolName}).`
				);
			}
			sumTierPct += pct;
			tierRows.push({ symbolName, giveawaySharePct: pct });
		}

		const totalRevenue = roundMoney(totalCodes * costPerCode);
		// Target pool is based on the giveawayPercentage
		const totalPrizePool = roundMoney(
			totalRevenue * (giveawayPercentage / 100)
		);

		const sumAll = roundMoney(sumTierPct + cashbackGiveawayPct);
		if (sumAll > giveawayPercentage + 0.0001) {
			return fail(
				res,
				400,
				`Sum of tiers (${roundMoney(sumTierPct)}%) and cashback (${roundMoney(cashbackGiveawayPct)}%) is ${sumAll}%; it cannot exceed the allowed giveaway of ${giveawayPercentage}%.`
			);
		}

		const jackpotRevenueShare = roundMoney(giveawayPercentage - sumAll);
		const jackpotPool = roundMoney(totalRevenue * (jackpotRevenueShare / 100));

		// For backward compatibility in Batch model (if it expects a % of pool), 
		// we calculate what % of the TOTAL giveaway pool the jackpot is.
		const leftoverGiveawayPct = totalPrizePool > 0 
			? roundMoney((jackpotPool / totalPrizePool) * 100) 
			: 0;
		if (leftoverGiveawayPct < 0) {
			return fail(res, 400, "Invalid giveaway split.");
		}

		const trimmedBn =
			typeof batchNumberRaw === "string" ? batchNumberRaw.trim() : "";
		let resolvedBatchNumber;
		if (trimmedBn) {
			const upper = trimmedBn.toUpperCase();
			if (!isValidManualBatchNumber(upper)) {
				return fail(
					res,
					400,
					"Optional batchNumber must look like CC-YYMM-PPP (e.g. AA-2603-010)."
				);
			}
			const exists = await Batch.findOne({ batchNumber: upper });
			if (exists) {
				return fail(res, 400, `Batch number "${upper}" already exists.`);
			}
			resolvedBatchNumber = upper;
		} else {
			resolvedBatchNumber = await allocateNextBatchNumber(
				new Date(),
				costPerCode
			);
		}

		const svgRows = await Svg.find({ type: svgThemeType }).lean();
		if (svgRows.length < 2) {
			return fail(
				res,
				400,
				`Upload at least two SVGs for theme "${svgThemeType}".`
			);
		}

		const byName = new Map(
			svgRows.map((r) => [String(r.name).toLowerCase(), r])
		);

		if (!byName.has(jackpotSymbol)) {
			return fail(
				res,
				400,
				`Jackpot symbol "${jackpotSymbol}" not found in theme "${svgThemeType}".`
			);
		}
		const jackpotPrizeEach = roundMoney(
			Number(byName.get(jackpotSymbol).prizeAmount) || 0
		);
		if (jackpotPrizeEach <= 0) {
			return fail(
				res,
				400,
				`Jackpot SVG "${jackpotSymbol}" must have prizeAmount > 0.`
			);
		}

		for (const tr of tierRows) {
			const doc = byName.get(tr.symbolName);
			if (!doc) {
				return fail(
					res,
					400,
					`Tier symbol "${tr.symbolName}" not found in theme "${svgThemeType}".`
				);
			}
			const pa = roundMoney(Number(doc.prizeAmount) || 0);
			if (pa <= 0) {
				return fail(
					res,
					400,
					`Tier symbol "${tr.symbolName}" must have prizeAmount > 0.`
				);
			}
			tr._prizeEach = pa;
		}

		// totalRevenue and totalPrizePool moved up to handle jackpot remainder calc early
		let marginRetainedFromPrizePool = 0;
		const tierCounts = {};
		const tierPrizeEach = {};

		for (const tr of tierRows) {
			// giveawaySharePct is now interpreted as % of total revenue
			const budget = roundMoney(
				totalRevenue * (tr.giveawaySharePct / 100)
			);
			const price = tr._prizeEach;
			const cnt = Math.floor(budget / price);
			const spent = roundMoney(cnt * price);
			const leftover = roundMoney(budget - spent);
			marginRetainedFromPrizePool = roundMoney(
				marginRetainedFromPrizePool + leftover
			);
			tierCounts[tr.symbolName] = cnt;
			tierPrizeEach[tr.symbolName] = price;
		}

		const cashbackBudget = roundMoney(
			totalRevenue * (cashbackGiveawayPct / 100)
		);
		const cashbackCount = Math.floor(cashbackBudget / costPerCode);
		const cashbackSpent = roundMoney(cashbackCount * costPerCode);
		marginRetainedFromPrizePool = roundMoney(
			marginRetainedFromPrizePool +
				roundMoney(cashbackBudget - cashbackSpent)
		);

		// jackpotPool is now calculated above relative to revenue/remainder
		// (line moved earlier to simplify logic)
		const jackpotCount = Math.floor(jackpotPool / jackpotPrizeEach);
		const jackpotSpent = roundMoney(jackpotCount * jackpotPrizeEach);
		marginRetainedFromPrizePool = roundMoney(
			marginRetainedFromPrizePool +
				roundMoney(jackpotPool - jackpotSpent)
		);

		const usedTickets =
			Object.values(tierCounts).reduce((a, b) => a + b, 0) +
			cashbackCount +
			jackpotCount;
		const loserCount = totalCodes - usedTickets;

		if (loserCount < 0) {
			return fail(
				res,
				400,
				`Not enough codes: need ${usedTickets} winner/cashback tickets but totalCodes is ${totalCodes}. Lower %, raise prices, or increase totalCodes.`
			);
		}

		const tierSymbolList = tierRows.map((r) => r.symbolName);
		const ruleBase = buildRulePack(svgRows, tierSymbolList, jackpotSymbol);

		/** @type {{ tier: string, prizeAmount: number, isWinner: boolean, isCashback: boolean, build: () => string[] }[]} */
		const plans = [];

		tierRows.forEach((tr, index) => {
			const tName = `t${index + 2}`;
			const n = tierCounts[tr.symbolName] || 0;
			const prize = tierPrizeEach[tr.symbolName];
			for (let i = 0; i < n; i++) {
				plans.push({
					tier: tName,
					prizeAmount: prize,
					isWinner: true,
					isCashback: false,
					build: () =>
						buildPriceTagTierWinPanel(ruleBase.themeTokens, {
							...ruleBase,
							tierSymbol: tr.symbolName,
						}),
				});
			}
		});

		for (let i = 0; i < jackpotCount; i++) {
			plans.push({
				tier: "jackpot",
				prizeAmount: jackpotPrizeEach,
				isWinner: true,
				isCashback: false,
				build: () =>
					buildPriceTagJackpotWinPanel(ruleBase.themeTokens, ruleBase),
			});
		}

		for (let i = 0; i < cashbackCount; i++) {
			plans.push({
				tier: "t1",
				prizeAmount: roundMoney(costPerCode),
				isWinner: false,
				isCashback: true,
				build: () =>
					buildPriceTagLoserLikePanel(ruleBase.themeTokens, ruleBase),
			});
		}

		for (let i = 0; i < loserCount; i++) {
			plans.push({
				tier: "loser",
				prizeAmount: 0,
				isWinner: false,
				isCashback: false,
				build: () =>
					buildPriceTagLoserLikePanel(ruleBase.themeTokens, ruleBase),
			});
		}

		for (let i = plans.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[plans[i], plans[j]] = [plans[j], plans[i]];
		}

		const docs = [];
		for (const plan of plans) {
			const symbolTokens = plan.build();
			const shortCode = newScratchShortCode();
			const encryptedCode = encrypt(shortCode);
			const lookupHash = hashForLookup(shortCode);
			docs.push({
				code: encryptedCode,
				lookupHash,
				symbolTokens,
				tier: plan.tier,
				maxMatchCount: panelMaxFrequency(symbolTokens),
				prizeAmount: plan.prizeAmount,
				isWinner: plan.isWinner,
				isCashback: plan.isCashback,
				isUsed: false,
			});
		}

		const mappedTierCounts = {
			loser: loserCount,
			jackpot: jackpotCount,
			t1: cashbackCount,
		};
		const mappedPrizeWeights = {
			jackpot: jackpotPrizeEach,
			t1: roundMoney(costPerCode),
		};
		tierRows.forEach((tr, index) => {
			const tName = `t${index + 2}`;
			mappedTierCounts[tName] = tierCounts[tr.symbolName] || 0;
			mappedPrizeWeights[tName] = tierPrizeEach[tr.symbolName] || 0;
		});

		const batch = await Batch.create({
			batchNumber: resolvedBatchNumber,
			mechanicVersion: 3,
			gameMode: "price_tag_v1",
			costPerCode,
			totalCodes,
			giveawayPercentage,
			jackpotGiveawayPercentage: leftoverGiveawayPct,
			totalRevenue,
			totalPrizePool,
			jackpotPool,
			otherPrizePool: roundMoney(totalPrizePool - jackpotPool),
			tierDistributionSnapshot: {
				priceTag: true,
				tierPayouts: tierRows.map(({ symbolName, giveawaySharePct }, index) => ({
					symbolName,
					giveawaySharePct,
					tier: `t${index + 2}`,
				})),
				cashback: { tier: "t1", giveawaySharePct: cashbackGiveawayPct },
				jackpot: { tier: "jackpot", symbol: jackpotSymbol },
				leftoverGiveawayPct,
			},
			prizeTierWeightsSnapshot: mappedPrizeWeights,
			tierCountsSnapshot: mappedTierCounts,
			jackpotPrizeEach,
			winningPrize: jackpotPrizeEach,
			marginRetainedFromPrizePool,
			symbolAlphabet: ruleBase.themeTokens.join("\x1e"),
			svgThemeType,
		});

		for (const d of docs) {
			d.batchNumber = batch._id;
		}

		await ScratchCode.insertMany(docs);

		console.log(LOG, "done", {
			batchNumber: resolvedBatchNumber,
			codesInserted: docs.length,
		});

		return res.json({
			success: true,
			message: "Batch created successfully (price tag mechanic).",
			batchNumber: resolvedBatchNumber,
			totalCodes,
			gameMode: "price_tag_v1",
			tierCounts: { ...tierCounts, jackpot: jackpotCount, cashback: cashbackCount, loser: loserCount },
			totalRevenue,
			totalPrizePool,
			jackpotPool,
			jackpotPrizeEach,
			marginRetainedFromPrizePool,
		});
	} catch (error) {
		console.error(LOG, "exception", error);
		return res.status(500).json({
			success: false,
			message: error.message || "Batch generation failed.",
		});
	}
}
