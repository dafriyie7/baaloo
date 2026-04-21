import mongoose from "mongoose";
import Player from "../models/Player.js";
import ScratchCode from "../models/ScratchCode.js";
import Transaction from "../models/Transaction.js";
import { escapeRegex } from "../lib/escapeRegex.js";
import {
	decrypt,
	hashForLookup,
	normalizeScratchCodeForLookup,
} from "../lib/encryption.js";
import {
	formatPhoneForGhanaMoMo,
	phonesMatch,
} from "../lib/phoneNormalize.js";
import shikaCreators from "../services/scPayment.js";
import { logger } from "../lib/logger.js";
import SystemSetting from "../models/SystemSetting.js";

// add a player
export const addPlayer = async (req, res) => {
	try {
		const { name, phone: rawPhone, code } = req.body;
		const phone = formatPhoneForGhanaMoMo(rawPhone);

		if (!name || !phone || !code) {
			return res
				.status(400)
				.json({ success: false, message: "Valid name, Ghana phone, and ticket code are required." });
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

		let message = "Your entry has been recorded!";
		if (payload.code?.tier === "jackpot") {
			message = "Congratulations! You've won the JACKPOT! Please contact management to claim your prize.";
		}

		return res.status(200).json({ success: true, data: payload, message });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

/**
 * Internal helper to process a Shika disbursement for a scratch code.
 * @param {Object} scratchCode - The ScratchCode document.
 * @param {Object} player - The Player document.
 * @returns {Promise<{success: boolean, message: string, data?: Object}>}
 */
async function processAutomaticPayout(scratchCode, player) {
	try {
		const amount = Number(scratchCode.prizeAmount);
		const eligible =
			(scratchCode.isWinner || scratchCode.isCashback) &&
			Number.isFinite(amount) &&
			amount > 0;

		if (!eligible) {
			return { success: false, message: "This ticket is not eligible for a cash payout." };
		}

		if (scratchCode.payoutStatus === "paid") {
			return { success: false, message: "Prize has already been paid for this ticket." };
		}

		const inFlight = await Transaction.findOne({
			scratchCode: scratchCode._id,
			status: { $in: ["pending", "processing"] },
			gatewayTransactionId: { $exists: true, $nin: [null, ""] },
		});

		if (inFlight) {
			return {
				success: true,
				message: "Payout is already being processed.",
				data: { status: "processing", disbursementId: inFlight.gatewayTransactionId },
			};
		}

		const moMoPhone = formatPhoneForGhanaMoMo(player.phone);
		if (!moMoPhone) {
			return { success: false, message: "Player has an invalid Ghana mobile number." };
		}

		const provider = shikaCreators.getProviderFromPhone(moMoPhone) || undefined;
		if (!provider) {
			return { success: false, message: "Could not detect mobile money network for this number." };
		}

		const currency = process.env.SC_CURRENCY || "GHS";

		const tx = await Transaction.create({
			scratchCode: scratchCode._id,
			player: player._id,
			amount,
			phone: moMoPhone,
			currency,
			type: "payout",
			status: "pending",
		});

		const idempotencyKey = shikaCreators.generateIdempotencyKey(
			String(scratchCode._id),
			"payout",
			tx._id.toString()
		);

		try {
			const disbursement = await shikaCreators.createDisbursement(
				{
					amount,
					currency,
					description: `Baaloo prize — ${String(scratchCode._id)}`,
					reference: `baaloo_${scratchCode._id}_${tx._id}`,
					metadata: {
						player_id: String(player._id),
						scratch_code_id: String(scratchCode._id),
						transaction_id: String(tx._id),
					},
					destination: {
						type: "mobile_money",
						phone_number: moMoPhone,
						provider,
					},
				},
				idempotencyKey
			);

			const gatewayId =
				disbursement?.id ??
				disbursement?.data?.id ??
				disbursement?.disbursement?.id;

			if (!gatewayId) {
				logger.error("Shika disbursement response missing id", { disbursement });
				tx.status = "failed";
				tx.note = "Gateway response missing disbursement id";
				tx.gatewayResponse = { ...(tx.gatewayResponse || {}), raw: disbursement };
				await tx.save();
				return {
					success: false,
					message: "Payment provider returned an unexpected response.",
				};
			}

			tx.gatewayTransactionId = gatewayId;
			tx.gatewayResponse = {
				...(tx.gatewayResponse || {}),
				create: disbursement,
			};
			await tx.save();

			return {
				success: true,
				message: "Payout started successfully.",
				data: { status: "pending", disbursementId: gatewayId, amount, currency },
			};
		} catch (err) {
			tx.status = "failed";
			tx.note = (typeof err.message === "string" && err.message.slice(0, 500)) || "Disbursement request failed";
			tx.gatewayResponse = {
				...(tx.gatewayResponse || {}),
				error: err.response?.data ?? err.message,
			};
			await tx.save();
			logger.error("disbursement failed", { err: err.message, response: err.response?.data });
			return {
				success: false,
				message: err.response?.data?.message || "Could not start payout.",
			};
		}
	} catch (error) {
		logger.error("processAutomaticPayout Error:", error);
		return { success: false, message: "Internal error processing payout." };
	}
}

/**
 * Start mobile-money payout for a redeemed winning ticket.
 * Body: { phone, ticket } — ticket is the same redemption code as on the card / QR (optional alias: code).
 */
export const claimWin = async (req, res) => {
	try {
		const { phone, ticket } = req.body;

		// 1. Check Global Payout Status
		const settings = await SystemSetting.getSettings();
		if (!settings.payoutsEnabled) {
			return res.status(403).json({
				success: false,
				message: "Automatic payouts are temporarily paused for maintenance. Please try again later or contact support."
			});
		}

		if (!phone || !ticket) {
			return res.status(400).json({
				success: false,
				message: "Phone and ticket are required.",
			});
		}

		const normalized = normalizeScratchCodeForLookup(ticket);
		if (!normalized) {
			return res.status(400).json({
				success: false,
				message: "Enter a valid ticket code.",
			});
		}
		const lookupHash = hashForLookup(normalized);

		const scratchCode = await ScratchCode.findOne({ lookupHash });
		if (!scratchCode) {
			return res.status(404).json({
				success: false,
				message: "Invalid ticket.",
			});
		}

		if (!scratchCode.isUsed || !scratchCode.redeemedBy) {
			return res.status(400).json({
				success: false,
				message: "This ticket has not been redeemed yet.",
			});
		}

		const player = await Player.findById(scratchCode.redeemedBy);
		if (!player) {
			return res.status(400).json({
				success: false,
				message: "Winner record not found.",
			});
		}

		if (!phonesMatch(phone, player.phone)) {
			return res.status(403).json({
				success: false,
				message: "Phone number does not match this ticket.",
			});
		}

		const result = await processAutomaticPayout(scratchCode, player);
		if (!result.success) {
			return res.status(400).json(result);
		}

		return res.status(200).json(result);
	} catch (error) {
		logger.error(error?.stack ? `${error.message}\n${error.stack}` : error.message);
		return res.status(500).json({
			success: false,
			message: error.message || "Server error",
		});
	}
};

/**
 * Administrative action: manually mark a winner as paid.
 * Param: id is the ScratchCode ID.
 */
export const markAsPaid = async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return res.status(400).json({ success: false, message: "Invalid ID" });
		}

		const code = await ScratchCode.findById(id);
		if (!code) {
			return res.status(404).json({ success: false, message: "Ticket not found" });
		}

		if (!code.isWinner && !code.isCashback) {
			return res.status(400).json({ success: false, message: "This ticket is not a winner." });
		}

		const player = await Player.findById(code.redeemedBy);
		if (!player) {
			return res.status(404).json({ success: false, message: "Winner record not found." });
		}

		const result = await processAutomaticPayout(code, player);
		if (!result.success) {
			return res.status(400).json(result);
		}

		return res.status(200).json({ success: true, message: "Payout initiated successfully via gateway." });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

async function playerBatchOptionsForFilter() {
	const rows = await ScratchCode.aggregate([
		{ $match: { isUsed: true } },
		{
			$lookup: {
				from: "batches",
				localField: "batchNumber",
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

export const getAllPlayers = async (req, res) => {
	try {
		const search = String(req.query.search ?? "").trim();
		const outcome = String(req.query.outcome ?? "all").toLowerCase();
		const batchId = String(req.query.batch ?? "all");
		const page = parseInt(req.query.page ?? 1);
		const limit = parseInt(req.query.limit ?? 20);
		const skip = (page - 1) * limit;

		// Global stats for the header
		const [stats, totalScanned] = await Promise.all([
			ScratchCode.aggregate([
				{ $match: { isUsed: true } },
				{
					$group: {
						_id: null,
						winners: { $sum: { $cond: [{ $or: ["$isWinner", "$isCashback"] }, 1, 0] } },
						losers: { $sum: { $cond: [{ $or: ["$isWinner", "$isCashback"] }, 0, 1] } },
					},
				},
			]),
			ScratchCode.countDocuments({ isUsed: true }),
		]);
		
		const winnersCount = stats[0]?.winners ?? 0;
		const losersCount = stats[0]?.losers ?? 0;

		const query = { isUsed: true };
		if (outcome === "winner") query.$or = [{ isWinner: true }, { isCashback: true }];
		else if (outcome === "loser") query.isWinner = false, query.isCashback = false;

		if (batchId !== "all") {
			if (!mongoose.Types.ObjectId.isValid(batchId)) {
				return res.status(400).json({ success: false, message: "Invalid batch id" });
			}
			query.batchNumber = new mongoose.Types.ObjectId(batchId);
		}

		if (search) {
			const esc = escapeRegex(search);
			const regex = { $regex: esc, $options: "i" };
			
			// Find players matching search to filter codes by user
			const playerIds = await Player.find({
				$or: [{ name: regex }, { phone: { $regex: esc } }]
			}).distinct("_id");

			query.$or = [
				{ redeemedBy: { $in: playerIds } },
				{ lookupHash: regex } // Maybe they searched for the code?
			];
		}

		const [filteredTotal, filteredWinners] = await Promise.all([
			ScratchCode.countDocuments(query),
			ScratchCode.countDocuments({ ...query, $or: [{ isWinner: true }, { isCashback: true }] })
		]);

		const totalPages = Math.ceil(filteredTotal / limit);

		const codes = await ScratchCode.find(query)
			.populate("redeemedBy")
			.populate("batchNumber")
			.sort({ redeemedAt: -1 })
			.skip(skip)
			.limit(limit);

		const batchOptions = await playerBatchOptionsForFilter();

		const codeIds = codes.map(c => c._id);
		const transactions = await Transaction.find({ 
			scratchCode: { $in: codeIds },
			type: "payout" 
		}).sort({ createdAt: -1 });

		// Decrypt codes and format for frontend
		const data = codes.map(c => {
			let plainCode = "-";
			try {
				if (c.code) plainCode = decrypt(c.code);
			} catch (e) {}

			// Find the latest transaction for this code
			const lastTx = transactions.find(t => String(t.scratchCode) === String(c._id));

			return {
				_id: c._id,
				code: plainCode,
				tier: c.tier,
				isWinner: c.isWinner,
				isCashback: c.isCashback,
				prizeAmount: c.prizeAmount,
				payoutStatus: c.payoutStatus,
				redeemedAt: c.redeemedAt,
				createdAt: c.redeemedAt || c.updatedAt,
				batch: c.batchNumber?.batchNumber || "Unknown",
				lastTransactionId: lastTx?._id,
				player: c.redeemedBy ? {
					_id: c.redeemedBy._id,
					name: c.redeemedBy.name,
					phone: c.redeemedBy.phone
				} : null
			};
		});

		return res.status(200).json({
			success: true,
			data: {
				players: data,
				totalPlayers: totalScanned,
				winnersCount,
				losersCount,
				filteredTotal,
				filteredWinners,
				filteredLosers: filteredTotal - filteredWinners,
				totalPages,
				batchOptions,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};
