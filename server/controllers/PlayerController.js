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
 * Start mobile-money payout for a redeemed winning ticket.
 * Body: { phone, ticket } — ticket is the same redemption code as on the card / QR (optional alias: code).
 */
export const claimWin = async (req, res) => {
	try {
		const ticket = req.body.ticket ?? req.body.code;
		const { phone } = req.body;

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

		if (scratchCode.tier === "jackpot") {
			return res.status(400).json({
				success: false,
				message: "Jackpot prizes must be claimed manually at our office. Please contact support.",
			});
		}

		const amount = Number(scratchCode.prizeAmount);
		const eligible =
			(scratchCode.isWinner || scratchCode.isCashback) &&
			Number.isFinite(amount) &&
			amount > 0;

		if (!eligible) {
			return res.status(400).json({
				success: false,
				message: "This ticket is not eligible for a cash payout.",
			});
		}

		if (scratchCode.payoutStatus === "paid") {
			return res.status(400).json({
				success: false,
				message: "Prize has already been paid for this ticket.",
			});
		}

		const inFlight = await Transaction.findOne({
			scratchCode: scratchCode._id,
			status: "pending",
			gatewayTransactionId: { $exists: true, $nin: [null, ""] },
		});
		if (inFlight) {
			return res.status(200).json({
				success: true,
				message: "Your payout is already being processed.",
				data: {
					status: "processing",
					disbursementId: inFlight.gatewayTransactionId,
				},
			});
		}

		const moMoPhone = formatPhoneForGhanaMoMo(phone);
		if (!moMoPhone) {
			return res.status(400).json({
				success: false,
				message: "Enter a valid Ghana mobile number.",
			});
		}

		const provider =
			shikaCreators.getProviderFromPhone(moMoPhone) || undefined;
		if (!provider) {
			return res.status(400).json({
				success: false,
				message:
					"Could not detect mobile money network for this number. Use a supported Ghana number.",
			});
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
				logger.error("Shika disbursement response missing id", {
					disbursement,
				});
				tx.status = "failed";
				tx.note = "Gateway response missing disbursement id";
				tx.gatewayResponse = { ...(tx.gatewayResponse || {}), raw: disbursement };
				await tx.save();
				return res.status(502).json({
					success: false,
					message:
						"Payment provider returned an unexpected response. Try again later.",
				});
			}

			tx.gatewayTransactionId = gatewayId;
			tx.gatewayResponse = {
				...(tx.gatewayResponse || {}),
				create: disbursement,
			};
			await tx.save();

			return res.status(200).json({
				success: true,
				message:
					"Payout started. Funds should arrive after your mobile money network confirms.",
				data: {
					status: "pending",
					disbursementId: gatewayId,
					amount,
					currency,
				},
			});
		} catch (err) {
			tx.status = "failed";
			tx.note =
				(typeof err.message === "string" && err.message.slice(0, 500)) ||
				"Disbursement request failed";
			tx.gatewayResponse = {
				...(tx.gatewayResponse || {}),
				error: err.response?.data ?? err.message,
			};
			await tx.save();
			logger.error("claimWin disbursement failed", {
				err: err.message,
				response: err.response?.data,
			});
			return res.status(502).json({
				success: false,
				message:
					err.response?.data?.message ||
					"Could not start payout. Please try again later.",
			});
		}
	} catch (error) {
		logger.error(error?.stack ? `${error.message}\n${error.stack}` : error.message);
		return res.status(500).json({
			success: false,
			message: error.message || "Server error",
		});
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
