import {
	JACKPOT_MAX_MATCH_COUNT,
	maxSymbolFrequency,
	SCRATCH_SYMBOL_COUNT,
} from "./scratchTierMath.js";

const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const N = SCRATCH_SYMBOL_COUNT;
const JACKPOT_PEAK = JACKPOT_MAX_MATCH_COUNT;
const INDEXES = Array.from({ length: N }, (_, i) => i);

function pickRandom(alphabet) {
	return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function shuffleInPlace(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

/**
 * Length SCRATCH_SYMBOL_COUNT; exactly one symbol appears JACKPOT_PEAK times (9), rest lower.
 */
export function generateJackpotSymbols(alphabet = DEFAULT_ALPHABET) {
	if (alphabet.length < 2) {
		throw new Error("Alphabet must have at least 2 characters for jackpot panel");
	}
	const winningChar = pickRandom(alphabet);
	const others = [...alphabet].filter((c) => c !== winningChar);
	const positions = shuffleInPlace([...INDEXES]);
	const winSet = new Set(positions.slice(0, JACKPOT_PEAK));
	const arr = [];

	for (let i = 0; i < N; i++) {
		if (winSet.has(i)) {
			arr[i] = winningChar;
		} else {
			arr[i] = pickRandom(others);
		}
	}

	const s = arr.join("");
	if (maxSymbolFrequency(s) !== JACKPOT_PEAK) {
		return generateJackpotSymbols(alphabet);
	}
	return s;
}

/** Max frequency ≤ 2 (losers and R1 “stake back” cards look the same). */
export function generateLoserSymbols(alphabet = DEFAULT_ALPHABET, maxAttempts = 500) {
	for (let a = 0; a < maxAttempts; a++) {
		let s = "";
		for (let i = 0; i < N; i++) s += pickRandom(alphabet);
		if (maxSymbolFrequency(s) <= 2) return s;
	}
	throw new Error("Failed to generate loser symbols; try a larger alphabet");
}

/**
 * R3/R5/R7: one symbol appears K times; all others strictly fewer than K (K = 3..8).
 */
export function generateRepeatTierSymbols(k, alphabet = DEFAULT_ALPHABET) {
	if (k < 3 || k > 8) {
		throw new Error("R-tier repetition K must be between 3 and 8");
	}

	const winningChar = pickRandom(alphabet);
	const others = [...alphabet].filter((c) => c !== winningChar);
	if (others.length === 0) {
		throw new Error("Alphabet too small for R-tier generation");
	}

	const idxs = shuffleInPlace([...INDEXES]);
	const winSet = new Set(idxs.slice(0, k));
	const arr = [];
	const counts = { [winningChar]: k };

	for (let i = 0; i < N; i++) {
		if (winSet.has(i)) {
			arr[i] = winningChar;
		}
	}

	const maxOther = k - 1;

	for (let i = 0; i < N; i++) {
		if (winSet.has(i)) continue;

		let chosen = null;
		const tryOrder = shuffleInPlace([...others]);
		for (const c of tryOrder) {
			const next = (counts[c] || 0) + 1;
			if (next <= maxOther && next < k) {
				chosen = c;
				break;
			}
		}

		if (!chosen) {
			tryOrder.sort((a, b) => (counts[a] || 0) - (counts[b] || 0));
			for (const c of tryOrder) {
				const next = (counts[c] || 0) + 1;
				if (next <= maxOther && next < k) {
					chosen = c;
					break;
				}
			}
		}

		if (!chosen) {
			return generateRepeatTierSymbols(k, alphabet);
		}

		arr[i] = chosen;
		counts[chosen] = (counts[chosen] || 0) + 1;
	}

	const s = arr.join("");
	if (maxSymbolFrequency(s) !== k) {
		return generateRepeatTierSymbols(k, alphabet);
	}
	return s;
}
