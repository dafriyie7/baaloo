import mongoose from "mongoose";

const scratchCodeSchema = new mongoose.Schema(
	{
		code: { type: String, required: true, unique: true },
		batchNumber: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Batch",
			required: true,
		},
		isWinner: { type: Boolean, default: false },
		isUsed: { type: Boolean, default: false },
		isPrinted: { type: Boolean, default: false },
		redeemedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "player",
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

const ScratchCode =
	mongoose.models.ScratchCode ||
	mongoose.model("ScratchCode", scratchCodeSchema);

export default ScratchCode;
