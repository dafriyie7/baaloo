import mongoose from "mongoose";
import Player from "../models/Player.js";
import ScratchCode from "../models/ScratchCode.js";
import { escapeRegex } from "../lib/escapeRegex.js";
import {
	decrypt,
	hashForLookup,
	normalizeScratchCodeForLookup,
} from "../lib/encryption.js";

// add a player
export const addPlayer = async (req, res) => {
	try {
		const { name, phone, code } = req.body;

		if (!name || !phone || !code) {
			return res
				.status(400)
				.json({ success: false, message: "all fields are required" });
		}

		const normalized = normalizeScratchCodeForLookup(code);
		if (!normalized) {
			return res.status(400).json({
				success: false,
				message: "Enter a valid redemption code.",
			});
		}
		const lookupHash = hashForLookup(normalized);

		const scratchCode = await ScratchCode.findOne({ lookupHash });

		// Verify the code exists, is a winner, and hasn't been claimed
		if (!scratchCode) {
			return res
				.status(404)
				.json({ success: false, message: "Invalid scratch code." });
		}
		if (scratchCode.redeemedBy) {
			return res.status(400).json({
				success: false,
				message: "This code has already been used.",
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

		const payload = player.toObject();
		if (payload.code?.code) {
			try {
				payload.code.plainCode = decrypt(payload.code.code);
			} catch {
				payload.code.plainCode = null;
			}
		}

		return res.status(200).json({ success: true, data: payload });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

async function playerBatchOptionsForFilter() {
	const rows = await Player.aggregate([
		{ $match: { code: { $exists: true, $ne: null } } },
		{
			$lookup: {
				from: "scratchcodes",
				localField: "code",
				foreignField: "_id",
				as: "sc",
			},
		},
		{ $unwind: "$sc" },
		{
			$lookup: {
				from: "batches",
				localField: "sc.batchNumber",
				foreignField: "_id",
				as: "b",
			},
		},
		{ $unwind: "$b" },
		{
			$group: {
				_id: "$b._id",
				batchNumber: { $first: "$b.batchNumber" },
			},
		},
		{ $sort: { batchNumber: 1 } },
		{
			$project: {
				_id: 0,
				id: { $toString: "$_id" },
				label: "$batchNumber",
			},
		},
	]);
	return rows;
}

// get all players (optional search / outcome / batch — query params)
export const getAllPlayers = async (req, res) => {
	try {
		const search = String(req.query.search ?? "").trim();
		const outcome = String(req.query.outcome ?? "all").toLowerCase();
		const batchId = String(req.query.batch ?? "all");

		const [globalAgg, totalPlayers] = await Promise.all([
			Player.aggregate([
				{ $match: { code: { $exists: true, $ne: null } } },
				{
					$lookup: {
						from: "scratchcodes",
						localField: "code",
						foreignField: "_id",
						as: "sc",
					},
				},
				{ $unwind: { path: "$sc", preserveNullAndEmptyArrays: true } },
				{
					$group: {
						_id: null,
						winners: {
							$sum: {
								$cond: [{ $eq: ["$sc.isWinner", true] }, 1, 0],
							},
						},
						losers: {
							$sum: {
								$cond: [{ $eq: ["$sc.isWinner", false] }, 1, 0],
							},
						},
					},
				},
			]),
			Player.countDocuments({ code: { $exists: true, $ne: null } }),
		]);
		const winnersCount = globalAgg[0]?.winners ?? 0;
		const losersCount = globalAgg[0]?.losers ?? 0;

		const codeFilter = {};
		if (outcome === "winner") codeFilter.isWinner = true;
		else if (outcome === "loser") codeFilter.isWinner = false;

		if (batchId !== "all") {
			if (!mongoose.Types.ObjectId.isValid(batchId)) {
				return res.status(400).json({
					success: false,
					message: "Invalid batch id",
				});
			}
			codeFilter.batchNumber = new mongoose.Types.ObjectId(batchId);
		}

		let codeIds = null;
		if (Object.keys(codeFilter).length > 0) {
			codeIds = await ScratchCode.find(codeFilter).distinct("_id");
			if (codeIds.length === 0) {
				const batchOptions = await playerBatchOptionsForFilter();
				return res.status(200).json({
					success: true,
					data: {
						players: [],
						totalPlayers,
						winnersCount,
						losersCount,
						filteredTotal: 0,
						filteredWinners: 0,
						filteredLosers: 0,
						batchOptions,
					},
				});
			}
		}

		const andParts = [];
		if (codeIds) andParts.push({ code: { $in: codeIds } });
		if (search) {
			const esc = escapeRegex(search);
			andParts.push({
				$or: [
					{ name: { $regex: esc, $options: "i" } },
					{
						$expr: {
							$regexMatch: {
								input: { $toString: "$phone" },
								regex: esc,
								options: "i",
							},
						},
					},
				],
			});
		}

		const query =
			andParts.length === 0
				? {}
				: andParts.length === 1
					? andParts[0]
					: { $and: andParts };

		const [players, batchOptions] = await Promise.all([
			Player.find(query).populate({
				path: "code",
				populate: { path: "batchNumber" },
			}),
			playerBatchOptionsForFilter(),
		]);

		const filteredWinners = players.filter((p) => p.code?.isWinner).length;
		const filteredLosers = players.length - filteredWinners;

		return res.status(200).json({
			success: true,
			data: {
				players,
				totalPlayers,
				winnersCount,
				losersCount,
				filteredTotal: players.length,
				filteredWinners,
				filteredLosers,
				batchOptions,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};
