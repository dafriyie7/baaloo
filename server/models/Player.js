import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	phone: {
		type: String,
		required: true,
		unique: true,
		index: true,
	},
	code: { type: mongoose.Schema.Types.ObjectId, ref: "ScratchCode" },
});

const Player = mongoose.models.Player || mongoose.model("Player", playerSchema);

export default Player;
