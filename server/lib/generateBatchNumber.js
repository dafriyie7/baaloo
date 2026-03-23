import BatchSequenceCounter from "../models/BatchSequenceCounter.js";

/** Two-letter counter AA–ZZ → 676 batches per (YYMM + price) bucket. */
const BATCH_ALPHA_MAX = 26 * 26;

/**
 * YYMM in IANA timezone (default UTC), e.g. March 2026 → "2603".
 */
export function getYyMM(date = new Date(), timeZone = process.env.BATCH_ID_TIMEZONE || "UTC") {
	const fmt = new Intl.DateTimeFormat("en-GB", {
		timeZone,
		year: "2-digit",
		month: "2-digit",
	});
	const parts = fmt.formatToParts(date);
	const year = parts.find((p) => p.type === "year")?.value;
	const month = parts.find((p) => p.type === "month")?.value;
	if (!year || !month) {
		throw new Error(`Could not resolve YYMM for timezone "${timeZone}"`);
	}
	return `${year}${month}`;
}

/**
 * Three-digit segment from price per code (rounded, 000–999).
 */
export function formatBatchPriceSegment(costPerCode) {
	const n = Math.round(Number(costPerCode));
	const clamped = Math.min(999, Math.max(0, n));
	return String(clamped).padStart(3, "0");
}

function seqToAlphaPair(seq) {
	const idx = seq - 1;
	if (idx < 0 || idx >= BATCH_ALPHA_MAX) {
		throw new Error("Internal: batch seq out of alpha range");
	}
	return String.fromCharCode(
		65 + Math.floor(idx / 26),
		65 + (idx % 26)
	);
}

function alphaPairToSeq(pair) {
	if (pair.length !== 2) return 0;
	const hi = pair.charCodeAt(0) - 65;
	const lo = pair.charCodeAt(1) - 65;
	if (hi < 0 || hi > 25 || lo < 0 || lo > 25) return 0;
	return hi * 26 + lo + 1;
}

/**
 * Next id: CC-YYMM-PPP — two-letter counter, year+month, 3-digit rounded price.
 * Example: AA-2603-010 (first batch for Mar 2026 at price segment 010).
 */
export async function allocateNextBatchNumber(
	date = new Date(),
	costPerCode = 0
) {
	const price3 = formatBatchPriceSegment(costPerCode);
	const yymm = getYyMM(date);
	const key = `${yymm}-${price3}`;

	const doc = await BatchSequenceCounter.findOneAndUpdate(
		{ key },
		{ $inc: { seq: 1 } },
		{ new: true, upsert: true }
	);

	if (doc.seq > BATCH_ALPHA_MAX) {
		throw new Error(
			`Batch counter limit (${BATCH_ALPHA_MAX}, AA–ZZ) reached for ${key}; change price, wait for next month, or set a manual batch id.`
		);
	}

	const letters = seqToAlphaPair(doc.seq);
	return `${letters}-${yymm}-${price3}`;
}

const MANUAL_PATTERN = /^([A-Z]{2})-(\d{4})-(\d{3})$/;

/**
 * Validate optional manual override: CC-YYMM-PPP (CC = AA–ZZ, MM = 01–12).
 */
export function isValidManualBatchNumber(s) {
	if (!s || typeof s !== "string") return false;
	const t = s.trim().toUpperCase();
	const m = MANUAL_PATTERN.exec(t);
	if (!m) return false;
	const seqN = alphaPairToSeq(m[1]);
	if (seqN < 1 || seqN > BATCH_ALPHA_MAX) return false;
	const mm = parseInt(m[2].slice(2), 10);
	if (mm < 1 || mm > 12) return false;
	return true;
}
