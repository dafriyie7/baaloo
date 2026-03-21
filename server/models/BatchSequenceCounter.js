import mongoose from "mongoose";

/**
 * Atomic monthly sequence per PREFIX-yyyyMM for batch IDs, e.g. BAA-202612 → 1,2,3…
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
