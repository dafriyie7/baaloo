import mongoose from "mongoose";

const winnerSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	phone: {
		type: Number,
		required: true,
	},
	code: {type: mongoose.Schema.Types.ObjectId, ref: "ScratchCode"}
})

const Winner =
	mongoose.models.Winner || mongoose.model("Winner", winnerSchema);

export default Winner