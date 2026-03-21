import BatchSequenceCounter from "../models/BatchSequenceCounter.js";

const PREFIX_MIN = 2;
const PREFIX_MAX = 4;
const MONTHLY_CAP = 9999;

/**
 * yyyyMM in IANA timezone (default UTC), month 01–12.
 */
export function getYyyyMM(date = new Date(), timeZone = process.env.BATCH_ID_TIMEZONE || "UTC") {
	const fmt = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
	});
	const parts = fmt.formatToParts(date);
	const year = parts.find((p) => p.type === "year")?.value;
	const month = parts.find((p) => p.type === "month")?.value;
	if (!year || !month) {
		throw new Error(`Could not resolve yyyyMM for timezone "${timeZone}"`);
	}
	return `${year}${month}`;
}

function normalizePrefix(raw) {
	const p = String(raw || "BAA")
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "");
	if (p.length < PREFIX_MIN || p.length > PREFIX_MAX) {
		throw new Error(
			`BATCH_ID_PREFIX must be ${PREFIX_MIN}–${PREFIX_MAX} letters/digits (got "${raw}")`
		);
	}
	return p;
}

/**
 * Next id: PREFIX-yyyyMM-NNNN (fixed 4-digit count, monthly reset).
 * Example: BAA-202612-0001
 */
export async function allocateNextBatchNumber(date = new Date()) {
	const prefix = normalizePrefix(process.env.BATCH_ID_PREFIX);
	const yyyyMM = getYyyyMM(date);
	const key = `${prefix}-${yyyyMM}`;

	const doc = await BatchSequenceCounter.findOneAndUpdate(
		{ key },
		{ $inc: { seq: 1 } },
		{ new: true, upsert: true }
	);

	if (doc.seq > MONTHLY_CAP) {
		throw new Error(
			`Monthly batch limit exceeded (${MONTHLY_CAP}) for ${key}`
		);
	}

	const count = String(doc.seq).padStart(4, "0");
	return `${prefix}-${yyyyMM}-${count}`;
}

const MANUAL_PATTERN = /^[A-Z0-9]{2,4}-\d{6}-\d{4}$/;

/**
 * Validate optional manual override (same visual shape as auto IDs).
 */
export function isValidManualBatchNumber(s) {
	if (!s || typeof s !== "string") return false;
	return MANUAL_PATTERN.test(s.trim().toUpperCase());
}
