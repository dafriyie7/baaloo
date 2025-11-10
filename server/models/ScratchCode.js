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
		patternMatch: { type: [String], required: true },
		lookupHash: {
			type: String,
			required: true,
			unique: true,
			index: true, // fast hash-based lookup
		},
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

// Optional performance indexes
scratchCodeSchema.index({ batch: 1, isWinner: 1 });
scratchCodeSchema.index({ isUsed: 1, isPrinted: 1 });

const ScratchCode =
	mongoose.models.ScratchCode ||
	mongoose.model("ScratchCode", scratchCodeSchema);

export default ScratchCode;
