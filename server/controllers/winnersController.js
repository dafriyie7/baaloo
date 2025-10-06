import Winner from "../models/Winner.js";
import ScratchCode from "../models/ScratchCode.js";

// add a winner
export const addWinner = async (req, res) => {
	try {
		const { name, phone, code } = req.body;

		if (!name || !phone || !code) {
			return res
				.status(400)
				.json({ success: false, message: "all fields are required" });
		}

		// Find the scratch code document by its code string
		const scratchCodeDoc = await ScratchCode.findOne({ code: code });

		// Verify the code exists, is a winner, and hasn't been claimed
		if (!scratchCodeDoc) {
			return res
				.status(404)
				.json({ success: false, message: "Invalid scratch code." });
		}
		if (scratchCodeDoc.redeemedBy) {
			return res.status(400).json({
				success: false,
				message: "This winning code has already been claimed.",
			});
		}

		// Create the winner and link the scratch code's ObjectId
		const winner = await Winner.create({
			name,
			phone,
			code: scratchCodeDoc._id,
		});

		// Mark the code as redeemed and link it to the winner
		scratchCodeDoc.redeemedBy = winner._id;
		scratchCodeDoc.redeemed = true;
		scratchCodeDoc.redeemedAt = new Date();
		await scratchCodeDoc.save();

		const populatedWinner = await winner.populate("code");

		return res.status(200).json({ success: true, data: populatedWinner });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// get all winners
export const getAllWinners = async (req, res) => {
	try {
		const winners = await Winner.find().populate("code");

		return res.status(200).json({ success: true, data: winners });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};
