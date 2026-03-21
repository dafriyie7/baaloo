/**
 * Largest-remainder allocation: percentages → integer counts summing to total.
 * @param {Record<string, number>} percentages - keys → percent (should sum ~100)
 * @param {number} total
 * @returns {Record<string, number>}
 */
export function allocateCountsFromPercentages(percentages, total) {
	const keys = Object.keys(percentages);
	if (keys.length === 0) {
		throw new Error("tierDistribution must not be empty");
	}

	const sumPct = keys.reduce((s, k) => s + Number(percentages[k]), 0);
	if (sumPct < 99.5 || sumPct > 100.5) {
		throw new Error(
			`tierDistribution percentages must sum to 100 (currently ${sumPct})`
		);
	}

	const rows = keys.map((k) => {
		const p = Number(percentages[k]);
		const exact = (total * p) / 100;
		const floor = Math.floor(exact);
		const remainder = exact - floor;
		return { key: k, floor, remainder };
	});

	const assigned = rows.reduce((s, r) => s + r.floor, 0);
	const leftover = total - assigned;

	const sorted = [...rows].sort((a, b) => b.remainder - a.remainder);
	const counts = Object.fromEntries(keys.map((k) => [k, 0]));
	for (const r of rows) counts[r.key] = r.floor;
	for (let i = 0; i < leftover; i++) {
		counts[sorted[i].key] += 1;
	}

	return counts;
}

export function computePools(totalCodes, costPerCode, giveawayPercentage, jackpotGiveawayPercentage) {
	const totalRevenue = totalCodes * costPerCode;
	const totalPrizePool =
		Math.round(totalRevenue * (giveawayPercentage / 100) * 100) / 100;
	const jackpotPool =
		Math.round(totalPrizePool * (jackpotGiveawayPercentage / 100) * 100) / 100;
	const otherPrizePool =
		Math.round((totalPrizePool - jackpotPool) * 100) / 100;
	return { totalRevenue, totalPrizePool, jackpotPool, otherPrizePool };
}

const M_TIERS = ["m3", "m4", "m5", "m6", "m7", "m8"];

/**
 * @param {Record<string, number>} counts
 * @param {Record<string, number>} weights - only m3..m8
 * @param {number} otherPrizePool
 * @param {number} jackpotPool
 * @returns {{ jackpotPrizeEach: number, tierPrizes: Record<string, number> }}
 */
export function computeTierPrizes(counts, weights, otherPrizePool, jackpotPool) {
	const jackpotCount = counts.jackpot || 0;
	if (jackpotCount > 0 && jackpotPool <= 0) {
		throw new Error("jackpot tickets require jackpotGiveawayPercentage > 0");
	}
	if (jackpotCount === 0 && jackpotPool > 0.0001) {
		throw new Error(
			"jackpotGiveawayPercentage allocates a jackpot pool but tierDistribution has no jackpot tickets"
		);
	}

	const jackpotPrizeEach =
		jackpotCount > 0
			? Math.round((jackpotPool / jackpotCount) * 100) / 100
			: 0;

	let sumWeighted = 0;
	for (const t of M_TIERS) {
		const n = counts[t] || 0;
		if (n <= 0) continue;
		const w = Number(weights[t]);
		if (!Number.isFinite(w) || w <= 0) {
			throw new Error(`prizeTierWeights.${t} must be a positive number when count > 0`);
		}
		sumWeighted += n * w;
	}

	const tierPrizes = {};
	if (sumWeighted <= 0) {
		if (otherPrizePool > 0.01) {
			throw new Error(
				"other prize pool is positive but no m3–m8 tiers have counts; add winner tiers or reduce giveaway"
			);
		}
		return { jackpotPrizeEach, tierPrizes };
	}

	const k = otherPrizePool / sumWeighted;
	for (const t of M_TIERS) {
		const n = counts[t] || 0;
		if (n <= 0) continue;
		tierPrizes[t] = Math.round(k * Number(weights[t]) * 100) / 100;
	}

	// Fix rounding drift on other pool
	let allocated = 0;
	for (const t of M_TIERS) {
		allocated += (counts[t] || 0) * (tierPrizes[t] || 0);
	}
	const drift = Math.round((otherPrizePool - allocated) * 100) / 100;
	if (Math.abs(drift) >= 0.01) {
		const adjustTier = M_TIERS.find((t) => (counts[t] || 0) > 0);
		if (adjustTier) {
			const n = counts[adjustTier];
			tierPrizes[adjustTier] =
				Math.round((tierPrizes[adjustTier] + drift / n) * 100) / 100;
		}
	}

	return { jackpotPrizeEach, tierPrizes };
}

export function maxFrequencyNine(symbols) {
	const freq = {};
	for (const ch of symbols) {
		freq[ch] = (freq[ch] || 0) + 1;
	}
	return Math.max(...Object.values(freq), 0);
}

export { M_TIERS };
