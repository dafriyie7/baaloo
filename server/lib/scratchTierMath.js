/** Cells on each scratch card (v2). */
export const SCRATCH_SYMBOL_COUNT = 16;

/**
 * Jackpot tier semantics: highest symbol count is still 9 (same as the old 9-cell “full card”).
 * The panel is larger; seven cells are non-jackpot filler symbols.
 */
export const JACKPOT_MAX_MATCH_COUNT = 9;

/** Stake-back tier: same symbol rules as loser; prize = stake (cost per code). */
export const R_STAKE_TIER = "r1";

/** R3, R5, R7: K = max repetitions of one symbol on the panel. */
export const R_WIN_TIERS = ["r3", "r5", "r7"];

export function maxSymbolFrequency(symbols) {
	const freq = {};
	for (const ch of symbols) {
		freq[ch] = (freq[ch] || 0) + 1;
	}
	return Math.max(...Object.values(freq), 0);
}

/** @deprecated use maxSymbolFrequency */
export const maxFrequencyNine = maxSymbolFrequency;
