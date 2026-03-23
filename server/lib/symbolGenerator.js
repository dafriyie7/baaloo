import {
	JACKPOT_MAX_MATCH_COUNT,
	maxTokenFrequency,
	SCRATCH_SYMBOL_COUNT,
} from "./scratchTierMath.js";

const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const N = SCRATCH_SYMBOL_COUNT;
const JACKPOT_PEAK = JACKPOT_MAX_MATCH_COUNT;
const INDEXES = Array.from({ length: N }, (_, i) => i);

function pickRandom(tokens) {
	return tokens[Math.floor(Math.random() * tokens.length)];
}

function shuffleInPlace(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

function defaultAlphabetTokens() {
	return [...DEFAULT_ALPHABET];
}

/**
 * Length SCRATCH_SYMBOL_COUNT; exactly one token appears JACKPOT_PEAK times (9), rest lower.
 * @param {string[]} alphabetTokens — distinct symbol ids (letters or full asset names)
 */
export function generateJackpotSymbols(alphabetTokens = defaultAlphabetTokens()) {
	if (alphabetTokens.length < 2) {
		throw new Error(
			"Alphabet must have at least 2 symbols for jackpot panel"
		);
	}
	const winning = pickRandom(alphabetTokens);
	const others = alphabetTokens.filter((t) => t !== winning);
	const positions = shuffleInPlace([...INDEXES]);
	const winSet = new Set(positions.slice(0, JACKPOT_PEAK));
	const arr = [];

	for (let i = 0; i < N; i++) {
		if (winSet.has(i)) {
			arr[i] = winning;
		} else {
			arr[i] = pickRandom(others);
		}
	}

	if (maxTokenFrequency(arr) !== JACKPOT_PEAK) {
		return generateJackpotSymbols(alphabetTokens);
	}
	return arr;
}

/**
 * Max frequency ≤ 2 (losers and R1 “stake back” cards look the same).
 * With small alphabets, pure random draws rarely hit the constraint; we then
 * build 8 distinct tokens × 2 copies (shuffled) when 2×|alphabet| ≥ N.
 */
export function generateLoserSymbols(
	alphabetTokens = defaultAlphabetTokens(),
	maxAttempts = 20000
) {
	for (let a = 0; a < maxAttempts; a++) {
		const arr = [];
		for (let i = 0; i < N; i++) {
			arr.push(pickRandom(alphabetTokens));
		}
		if (maxTokenFrequency(arr) <= 2) return arr;
	}
	if (alphabetTokens.length * 2 >= N) {
		const order = shuffleInPlace([...alphabetTokens]);
		const needDistinct = Math.ceil(N / 2);
		const picked = order.slice(0, needDistinct);
		const pool = picked.flatMap((t) => [t, t]);
		return shuffleInPlace(pool);
	}
	throw new Error("Failed to generate loser symbols; try a larger alphabet");
}

/**
 * R3/R5/R7: one token appears K times; all others strictly fewer than K (K = 3..8).
 */
export function generateRepeatTierSymbols(
	k,
	alphabetTokens = defaultAlphabetTokens()
) {
	if (k < 3 || k > 8) {
		throw new Error("R-tier repetition K must be between 3 and 8");
	}

	const winning = pickRandom(alphabetTokens);
	const others = alphabetTokens.filter((t) => t !== winning);
	if (others.length === 0) {
		throw new Error("Alphabet too small for R-tier generation");
	}

	const idxs = shuffleInPlace([...INDEXES]);
	const winSet = new Set(idxs.slice(0, k));
	const arr = [];
	const counts = { [winning]: k };

	for (let i = 0; i < N; i++) {
		if (winSet.has(i)) {
			arr[i] = winning;
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
			return generateRepeatTierSymbols(k, alphabetTokens);
		}

		arr[i] = chosen;
		counts[chosen] = (counts[chosen] || 0) + 1;
	}

	if (maxTokenFrequency(arr) !== k) {
		return generateRepeatTierSymbols(k, alphabetTokens);
	}
	return arr;
}
