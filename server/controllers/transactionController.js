import Transaction from "../models/Transaction.js";
import ScratchCode from "../models/ScratchCode.js";
import Player from "../models/Player.js";

/**
 * Get all transactions with pagination and filtering.
 */
export const getAllTransactions = async (req, res) => {
	try {
		const { 
			page = 1, 
			limit = 20, 
			status, 
			search, 
			startDate, 
			endDate 
		} = req.query;

		const query = {};

		if (status && status !== "all") {
			query.status = status;
		}

		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) query.createdAt.$gte = new Date(startDate);
			if (endDate) query.createdAt.$lte = new Date(endDate);
		}

		if (search && search.trim()) {
			const s = search.trim();
			const regex = { $regex: s, $options: "i" };
			
			// Find players matching search to get their IDs
			const matchingPlayers = await Player.find({
				$or: [{ name: regex }, { phone: regex }]
			}).select("_id");
			const playerIds = matchingPlayers.map(p => p._id);

			query.$or = [
				{ phone: regex },
				{ gatewayTransactionId: regex },
				{ player: { $in: playerIds } }
			];
		}

		const transactions = await Transaction.find(query)
			.populate("player", "name phone")
			.populate({
				path: "scratchCode",
				select: "tier prizeAmount",
				populate: { path: "batchNumber", select: "batchNumber" }
			})
			.sort({ createdAt: -1 })
			.limit(Number(limit))
			.skip((Number(page) - 1) * Number(limit));

		const total = await Transaction.countDocuments(query);

		res.status(200).json({
			success: true,
			data: {
				transactions,
				total,
				pages: Math.ceil(total / limit),
				currentPage: Number(page)
			}
		});
	} catch (error) {
		console.error("Get Transactions Error:", error);
		res.status(500).json({ success: false, message: "Server error fetching transactions." });
	}
};

/**
 * Get transaction stats for overview.
 */
export const getTransactionStats = async (req, res) => {
	try {
		const stats = await Transaction.aggregate([
			{
				$group: {
					_id: "$status",
					count: { $sum: 1 },
					totalAmount: { $sum: "$amount" }
				}
			}
		]);

		const totalPayouts = await Transaction.countDocuments();
		const completedAmount = stats.find(s => s._id === "completed")?.totalAmount || 0;
		const pendingAmount = stats.find(s => s._id === "pending")?.totalAmount || 0;

		res.status(200).json({
			success: true,
			stats: {
				breakdown: stats,
				totalPayouts,
				completedAmount,
				pendingAmount
			}
		});
	} catch (error) {
		console.error("Get Transaction Stats Error:", error);
		res.status(500).json({ success: false, message: "Server error fetching stats." });
	}
};
