import ScratchCode from "../models/ScratchCode.js";
import Batch from "../models/Batch.js";
import { v4 as uuid } from "uuid";
import QRCode from "qrcode";
import { encrypt, decrypt, hashForLookup } from "../lib/encryption.js";

// generate new scratch code
export const generateBatch = async (req, res) => {
	try {
		const {
			totalCodes,
			costPerCode,
			giveawayPercentage,
			winningPrize,
			batchNumber,
		} = req.body;

		if (
			!totalCodes ||
			!costPerCode ||
			!giveawayPercentage ||
			!winningPrize ||
			!batchNumber
		) {
			return res.status(400).json({
				success: false,
				message: "All fields are required.",
			});
		}

		// Derived values
		const totalRevenue = totalCodes * costPerCode;
		const totalPrizePool = totalRevenue * (giveawayPercentage / 100);
		const numWinners = Math.floor(totalPrizePool / winningPrize);

		if (numWinners > totalCodes) {
			return res.status(400).json({
				success: false,
				message: "Number of winners cannot exceed total codes.",
			});
		}

		// Winner distribution
		const prizeDistribution = Array(totalCodes).fill(false);
		for (let i = 0; i < numWinners; i++) prizeDistribution[i] = true;

		// Shuffle winners
		for (let i = prizeDistribution.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[prizeDistribution[i], prizeDistribution[j]] = [
				prizeDistribution[j],
				prizeDistribution[i],
			];
		}

		// Create batch
		const batch = await Batch.create({
			batchNumber,
			costPerCode,
			totalCodes,
			giveawayPercentage,
			totalRevenue,
			totalPrizePool,
			winningPrize,
		});

		// Build codes
		const codes = [];
		for (let i = 0; i < totalCodes; i++) {
			const shortCode = uuid().split("-")[0].toUpperCase();
			const encryptedCode = encrypt(shortCode); // encrypt before save
			const lookupHash = hashForLookup(shortCode);
			codes.push({
				code: encryptedCode,
				lookupHash,
				batchNumber: batch._id,
				isWinner: prizeDistribution[i],
				prize: prizeDistribution[i] ? winningPrize : 0,
				// plainCode: shortCode,
			});
		}

		// Shuffle once
		for (let i = codes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[codes[i], codes[j]] = [codes[j], codes[i]];
		}

		// Save all (omit plainCode if not stored in schema)
		const toSave = codes.map(({ plainCode, ...rest }) => rest);
		const savedCodes = await ScratchCode.insertMany(toSave);

		return res.json({
			success: true,
			message: "Batch created successfully",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// redeem code
export const redeemScratchCode = async (req, res) => {
	try {
		const { scratchCode } = req.body;

		// Encrypt the incoming plain code to match the stored format
		const encryptedCode = encrypt(scratchCode);

		// 1. Find the code in the database
		const code = await ScratchCode.findOne({ code: encryptedCode });

		// 2. Check if the code is invalid (not found)
		if (!code) {
			return res
				.status(404)
				.json({ success: false, message: "Invalid scratch code." });
		}

		// 3. Check if the code has already been used
		if (code.redeemed) {
			return res.status(400).json({
				success: false,
				message: "This scratch code has already been used.",
			});
		}

		return res.status(200).json({
			success: true,
			prize: code.prize === 1, // will return true if prize=1, false if prize=0
			message:
				code.prize === 1
					? "Congratulations! You've won!"
					: "Sorry, not a winner this time.",
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// get all codes
export const getAllScratchCodes = async (req, res) => {
	try {
		const { selectedBatch } = req.query;
		const { origin } = req.headers;

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;

		const batches = await Batch.find();

		if (batches.length === 0 && !selectedBatch) {
			return res.status(200).json({
				success: true,
				data: {
					withQRCodes: [],
					batches: [],
					totalPages: 0,
					currentPage: 1,
				},
			});
		}

		const queryBatch =
			selectedBatch || (batches.length > 0 ? batches[0]._id : null);
		const query = queryBatch ? { batchNumber: queryBatch } : {};

		const codes = await ScratchCode.find(query)
			.limit(limit)
			.skip((page - 1) * limit)
			.select("-isWinner")
			.lean();

		const totalCodes = await ScratchCode.countDocuments(query);

		// Decrypt and build QR data
		const withQRCodes = await Promise.all(
			codes.map(async (c) => {
				let plainCode;
				try {
					plainCode = decrypt(c.code);
				} catch {
					plainCode = "[DECRYPTION_FAILED]";
				}

				const scanUrl = `${origin}/scratch/${plainCode}`;
				const qrImage = await QRCode.toDataURL(scanUrl);

				return { ...c, code: plainCode, qrImage };
			})
		);

		return res.status(200).json({
			success: true,
			data: {
				withQRCodes,
				batches,
				totalPages: Math.ceil(totalCodes / limit),
				currentPage: page,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};
