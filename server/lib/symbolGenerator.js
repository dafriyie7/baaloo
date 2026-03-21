import { maxFrequencyNine } from "./scratchTierMath.js";

const DEFAULT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

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

/** @returns {string} length 9 */
export function generateJackpotSymbols(alphabet = DEFAULT_ALPHABET) {
	const c = pickRandom(alphabet);
	return c.repeat(9);
}

/** Max frequency ≤ 2 */
export function generateLoserSymbols(alphabet = DEFAULT_ALPHABET, maxAttempts = 500) {
	for (let a = 0; a < maxAttempts; a++) {
		let s = "";
		for (let i = 0; i < 9; i++) s += pickRandom(alphabet);
		if (maxFrequencyNine(s) <= 2) return s;
	}
	throw new Error("Failed to generate loser symbols; try a larger alphabet");
}

/**
 * Exactly max frequency K (K = 3..8). One symbol appears K times; all others < K.
 */
export function generateMKSymbols(k, alphabet = DEFAULT_ALPHABET) {
	if (k < 3 || k > 8) {
		throw new Error("m-tier K must be between 3 and 8");
	}

	const winningChar = pickRandom(alphabet);
	const others = [...alphabet].filter((c) => c !== winningChar);
	if (others.length === 0) {
		throw new Error("Alphabet too small for m-tier generation");
	}

	const idxs = shuffleInPlace([0, 1, 2, 3, 4, 5, 6, 7, 8]);
	const winSet = new Set(idxs.slice(0, k));
	const arr = [];
	const counts = { [winningChar]: k };

	for (let i = 0; i < 9; i++) {
		if (winSet.has(i)) {
			arr[i] = winningChar;
		}
	}

	const maxOther = k - 1;

	for (let i = 0; i < 9; i++) {
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
			return generateMKSymbols(k, alphabet);
		}

		arr[i] = chosen;
		counts[chosen] = (counts[chosen] || 0) + 1;
	}

	const s = arr.join("");
	if (maxFrequencyNine(s) !== k) {
		return generateMKSymbols(k, alphabet);
	}
	return s;
}
