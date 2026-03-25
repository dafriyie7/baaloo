import { maxTokenFrequency, SCRATCH_SYMBOL_COUNT } from "./scratchTierMath.js";

const N = SCRATCH_SYMBOL_COUNT;

function shuffleInPlace(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/**
 * @param {string} token
 * @param {{ plan: 'tier'|'jackpot'|'loser', tierSymbol?: string, jackpotSymbol: string, winnerSet: Set<string>, paidNonWinnerSet: Set<string>, zeroPrizeSet: Set<string> }} ctx
 */
function maxCapForToken(token, ctx) {
	const {
		plan,
		tierSymbol,
		jackpotSymbol,
		winnerSet,
		paidNonWinnerSet,
		zeroPrizeSet,
	} = ctx;

	if (plan === "tier") {
		if (token === tierSymbol) return 3;
		if (token === jackpotSymbol) return 1;
		if (winnerSet.has(token)) return 2;
		if (paidNonWinnerSet.has(token)) return 2;
		if (zeroPrizeSet.has(token)) return 3;
		return 2;
	}
	if (plan === "jackpot") {
		if (token === jackpotSymbol) return 1;
		if (winnerSet.has(token)) return 2;
		if (paidNonWinnerSet.has(token)) return 2;
		if (zeroPrizeSet.has(token)) return 3;
		return 2;
	}
	// loser / cashback — same layout rules
	if (winnerSet.has(token)) return 2;
	if (paidNonWinnerSet.has(token)) return 2;
	if (zeroPrizeSet.has(token)) return 3;
	return 2;
}

function countTokens(arr) {
	const m = {};
	for (const t of arr) {
		if (t == null) continue;
		m[t] = (m[t] || 0) + 1;
	}
	return m;
}

function canPlace(counts, token, ctx) {
	const cap = maxCapForToken(token, ctx);
	const next = (counts[token] || 0) + 1;
	return next <= cap;
}

/**
 * Fill null slots in panel with theme tokens respecting caps.
 * @returns {string[]|null}
 */
function fillNullSlots(panel, themeTokens, ctx, maxAttempts = 8000) {
	const tokens = [...themeTokens];
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const arr = [...panel];
		const counts = countTokens(arr);
		let ok = true;
		for (let i = 0; i < N; i++) {
			if (arr[i] != null) continue;
			shuffleInPlace(tokens);
			let placed = false;
			for (const t of tokens) {
				if (canPlace(counts, t, ctx)) {
					arr[i] = t;
					counts[t] = (counts[t] || 0) + 1;
					placed = true;
					break;
				}
			}
			if (!placed) {
				ok = false;
				break;
			}
		}
		if (ok && !arr.includes(null) && arr.length === N) {
			return arr;
		}
	}
	return null;
}

function emptyPanelWithSeeds(seeds) {
	/** @type {(string|null)[]} */
	const arr = new Array(N).fill(null);
	for (const { index, token } of seeds) {
		arr[index] = token;
	}
	return arr;
}

function randomDistinctIndices(k) {
	const idx = Array.from({ length: N }, (_, i) => i);
	shuffleInPlace(idx);
	return idx.slice(0, k);
}

/**
 * @param {string[]} themeTokens
 * @param {{ tierSymbol: string, jackpotSymbol: string, winnerSet: Set<string>, paidNonWinnerSet: Set<string>, zeroPrizeSet: Set<string> }} rulePack
 */
export function buildPriceTagTierWinPanel(themeTokens, rulePack) {
	const { tierSymbol, jackpotSymbol, winnerSet, paidNonWinnerSet, zeroPrizeSet } =
		rulePack;
	const ctx = {
		plan: "tier",
		tierSymbol,
		jackpotSymbol,
		winnerSet,
		paidNonWinnerSet,
		zeroPrizeSet,
	};
	const positions = randomDistinctIndices(4);
	const seeds = [
		{ index: positions[0], token: tierSymbol },
		{ index: positions[1], token: tierSymbol },
		{ index: positions[2], token: tierSymbol },
		{ index: positions[3], token: jackpotSymbol },
	];
	const panel = emptyPanelWithSeeds(seeds);
	const filled = fillNullSlots(panel, themeTokens, ctx);
	if (!filled) {
		throw new Error("priceTag: failed to fill tier-win panel");
	}
	return filled;
}

export function buildPriceTagJackpotWinPanel(themeTokens, rulePack) {
	const { jackpotSymbol, winnerSet, paidNonWinnerSet, zeroPrizeSet } =
		rulePack;
	const ctx = {
		plan: "jackpot",
		jackpotSymbol,
		winnerSet,
		paidNonWinnerSet,
		zeroPrizeSet,
	};
	const idx = Math.floor(Math.random() * N);
	const panel = emptyPanelWithSeeds([{ index: idx, token: jackpotSymbol }]);
	const filled = fillNullSlots(panel, themeTokens, ctx);
	if (!filled) {
		throw new Error("priceTag: failed to fill jackpot-win panel");
	}
	return filled;
}

export function buildPriceTagLoserLikePanel(themeTokens, rulePack) {
	const { winnerSet, paidNonWinnerSet, zeroPrizeSet, jackpotSymbol } =
		rulePack;
	const ctx = {
		plan: "loser",
		jackpotSymbol,
		winnerSet,
		paidNonWinnerSet,
		zeroPrizeSet,
	};
	/** @type {(string|null)[]} */
	const panel = new Array(N).fill(null);
	const filled = fillNullSlots(panel, themeTokens, ctx);
	if (!filled) {
		throw new Error("priceTag: failed to fill loser-like panel");
	}
	return filled;
}

export function panelMaxFrequency(tokens) {
	return maxTokenFrequency(tokens);
}
