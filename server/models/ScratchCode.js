import mongoose from "mongoose";
import { SCRATCH_SYMBOL_COUNT } from "../lib/scratchTierMath.js";

const scratchCodeSchema = new mongoose.Schema(
	{
		code: { type: String, required: true, unique: true, trim: true },
		batchNumber: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Batch",
			required: true,
			index: true,
		},
		/** Panel cells: SCRATCH_SYMBOL_COUNT string tokens (letters or Svg.name). */
		symbolTokens: {
			type: [{ type: String, maxlength: 64 }],
			required: true,
			validate: {
				validator(v) {
					return Array.isArray(v) && v.length === SCRATCH_SYMBOL_COUNT;
				},
				message: `symbolTokens must be an array of length ${SCRATCH_SYMBOL_COUNT}`,
			},
		},
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
		/** price_tag_v1: stake-back ticket that looks like a loser panel */
		isCashback: { type: Boolean, default: false },
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
