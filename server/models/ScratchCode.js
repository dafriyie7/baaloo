import mongoose from "mongoose";

const scratchCodeSchema = new mongoose.Schema(
	{
		code: { type: String, unique: true, required: true },
		batch: { type: String }, // batch identifier
		redeemed: { type: Boolean, default: false },
		redeemedAt: { type: Date },
		redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
		prize: { type: Number, default: 0 }, // Link to prize
	},
	{ timestamps: true }
);

const ScratchCode =
	mongoose.models.ScratchCode ||
	mongoose.model("ScratchCode", scratchCodeSchema);

export default ScratchCode;
