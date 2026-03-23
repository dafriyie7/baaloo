/** Cells on each scratch card panel. */
export const SCRATCH_SYMBOL_COUNT = 16;

/**
 * Jackpot tier: one token appears this many times on the panel (remaining cells are fillers).
 */
export const JACKPOT_MAX_MATCH_COUNT = 9;

/** Stake-back tier: same symbol rules as loser; prize = stake (cost per code). */
export const R_STAKE_TIER = "r1";

/** R3, R5, R7: K = max repetitions of one symbol on the panel. */
export const R_WIN_TIERS = ["r3", "r5", "r7"];

/** Max count of any identical token (e.g. asset name or single letter). */
export function maxTokenFrequency(tokens) {
	const freq = {};
	for (const t of tokens) {
		freq[t] = (freq[t] || 0) + 1;
	}
	return Math.max(...Object.values(freq), 0);
}

