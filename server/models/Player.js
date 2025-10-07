import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	phone: {
		type: Number,
		required: true,
	},
	code: { type: mongoose.Schema.Types.ObjectId, ref: "ScratchCode" },
});

const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);

export default Player;
