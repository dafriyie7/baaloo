import mongoose from "mongoose";

/**
 * Atomic sequence per YYMM-PPP bucket for batch IDs (calendar month + price segment), e.g. 2603-010 → 1…676 (AA–ZZ).
 */
const batchSequenceCounterSchema = new mongoose.Schema(
	{
		key: { type: String, required: true, unique: true },
		seq: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

const BatchSequenceCounter =
	mongoose.models.BatchSequenceCounter ||
	mongoose.model("BatchSequenceCounter", batchSequenceCounterSchema);

export default BatchSequenceCounter;
