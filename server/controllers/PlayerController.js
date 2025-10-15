import Player from "../models/Player.js";
import ScratchCode from "../models/ScratchCode.js";

// add a player
export const addPlayer = async (req, res) => {
	try {
		const { name, phone, code } = req.body;

		if (!name || !phone || !code) {
			return res
				.status(400)
				.json({ success: false, message: "all fields are required" });
		}

		// Find the scratch code document by its code string
		const scratchCode = await ScratchCode.findOne({ code: code });

		// Verify the code exists, is a winner, and hasn't been claimed
		if (!scratchCode) {
			return res
				.status(404)
				.json({ success: false, message: "Invalid scratch code." });
		}
		if (scratchCode.redeemedBy) {
			return res.status(400).json({
				success: false,
				message: "This winning code has already been claimed.",
			});
		}

		// Create the winner and link the scratch code's ObjectId
		let player = await Player.create({
			name,
			phone,
			code: scratchCode._id,
		});

		// Mark the code as redeemed and link it to the winner
		scratchCode.redeemedBy = player._id;
		scratchCode.isUsed = true;
		scratchCode.redeemedAt = new Date();
		await scratchCode.save();

		// Repopulate the player with the full scratch code details, including the batch
		player = await player.populate({
			path: "code",
			populate: { path: "batchNumber" },
		});

		return res.status(200).json({ success: true, data: player });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// get all winners
export const getAllPlayers = async (req, res) => {
	try {
		const players = await Player.find().populate({
			path: "code",
			populate: { path: "batchNumber" },
		});
		const winnersCount = players.filter((p) => p.code?.isWinner).length;
		const losersCount = players.filter((p) => !p.code?.isWinner).length;

		return res.status(200).json({
			success: true,
			data: { players, winnersCount, losersCount },
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};
