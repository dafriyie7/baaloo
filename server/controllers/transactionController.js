import Transaction from "../models/Transaction.js";
import ScratchCode from "../models/ScratchCode.js";
import Player from "../models/Player.js";
import shikaCreators from "../services/scPayment.js";
import shikaWebhookService from "../services/scWebhook.js";
import { logger } from "../lib/logger.js";

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

/**
 * Manually sync a pending transaction status with the gateway.
 */
export const syncTransactionStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const transaction = await Transaction.findById(id);

		if (!transaction) {
			return res.status(404).json({ success: false, message: "Transaction not found." });
		}

		if (transaction.status !== "pending") {
			return res.status(200).json({ 
				success: true, 
				message: `Transaction is already in ${transaction.status} state.`,
				status: transaction.status 
			});
		}

		if (!transaction.gatewayTransactionId) {
			return res.status(400).json({ success: false, message: "Transaction has no gateway ID." });
		}

		logger.info(`Manually syncing transaction ${id} (${transaction.gatewayTransactionId})`);

		const disbursement = await shikaCreators.getDisbursement(transaction.gatewayTransactionId);
		
		if (!disbursement) {
			return res.status(502).json({ success: false, message: "Could not fetch data from payment gateway." });
		}

		const scStatus = disbursement.status || disbursement.data?.status;
		const scPayload = disbursement.data || disbursement;

		// Map Shika status to our internal status
		// created | pending | processing | completed | failed | canceled
		if (scStatus === "completed") {
			await shikaWebhookService.handlePayoutCompleted(scPayload, "MANUAL_SYNC");
		} else if (scStatus === "failed") {
			await shikaWebhookService.handlePayoutFailed(scPayload, "MANUAL_SYNC");
		} else if (scStatus === "canceled" || scStatus === "cancelled") {
			await shikaWebhookService.handlePayoutCanceled(scPayload, "MANUAL_SYNC");
		} else if (scStatus === "processing" || scStatus === "pending") {
			// Update to processing/pending if it was just 'created' or we want to reflect current SC state
			if (transaction.status !== scStatus) {
				transaction.status = scStatus === "pending" ? "pending" : "processing";
				transaction.gatewayResponse = {
					...(transaction.gatewayResponse || {}),
					lastSyncAt: new Date(),
					lastPayload: scPayload
				};
				await transaction.save();
			}
		}

		const updatedTx = await Transaction.findById(id);

		res.status(200).json({
			success: true,
			message: `Status synced. Gateway says: ${scStatus}`,
			status: updatedTx.status,
			gatewayStatus: scStatus
		});

	} catch (error) {
		logger.error("Sync Transaction Status Error:", error);
		res.status(500).json({ success: false, message: error.message || "Server error syncing status." });
	}
};

/**
 * Get raw disbursement details directly from the gateway.
 */
export const getGatewayDetails = async (req, res) => {
	try {
		const { id } = req.params;
		const transaction = await Transaction.findById(id);

		if (!transaction || !transaction.gatewayTransactionId) {
			return res.status(404).json({ success: false, message: "Gateway transaction record not found." });
		}

		const disbursement = await shikaCreators.getDisbursement(transaction.gatewayTransactionId);
		
		res.status(200).json({
			success: true,
			disbursement
		});
	} catch (error) {
		logger.error("Get Gateway Details Error:", error);
		res.status(500).json({ success: false, message: "Could not fetch gateway details." });
	}
};
