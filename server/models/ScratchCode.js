import mongoose from "mongoose";

const scratchCodeSchema = new mongoose.Schema(
	{
		code: { type: String, required: true, unique: true, trim: true },
		batchNumber: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Batch",
			required: true,
			index: true,
		},
		/** Scratch panel (v2); length matches SCRATCH_SYMBOL_COUNT on server (16). */
		symbols: { type: String, default: "", maxlength: 16 },
		/** @deprecated v1 */
		patternMatch: { type: [String], default: [] },
		lookupHash: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		tier: { type: String, default: "loser" },
		maxMatchCount: { type: Number, default: 0 },
		prizeAmount: { type: Number, default: 0 },
		isWinner: { type: Boolean, default: false },
		isUsed: { type: Boolean, default: false },
		isPrinted: { type: Boolean, default: false },
		redeemedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Player",
			default: null,
		},
		redeemedAt: { type: Date, default: null },
		payoutStatus: {
			type: String,
			enum: ["pending", "paid", "failed"],
			default: "pending",
		},
	},
	{ timestamps: true }
);

scratchCodeSchema.index({ batchNumber: 1, isWinner: 1 });
scratchCodeSchema.index({ isUsed: 1, isPrinted: 1 });

const ScratchCode =
	mongoose.models.ScratchCode ||
	mongoose.model("ScratchCode", scratchCodeSchema);

export default ScratchCode;
