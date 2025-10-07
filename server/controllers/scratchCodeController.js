import ScratchCode from "../models/ScratchCode.js";
import { v4 as uuid } from "uuid";
import QRCode from "qrcode";

// generate new scratch code
export const generateBatch = async (req, res) => {
	try {
		const { count, batchNumber, winRate = 0.2 } = req.body;

		// Calculate the exact number of winners
		const numWinners = Math.floor(count * winRate);

		// Create an array to represent prize status for each code
		const prizeDistribution = Array(count).fill(0);
		for (let i = 0; i < numWinners; i++) {
			prizeDistribution[i] = 1;
		}

		// Shuffle the array to randomize winner positions (Fisher-Yates shuffle)
		for (let i = prizeDistribution.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[prizeDistribution[i], prizeDistribution[j]] = [
				prizeDistribution[j],
				prizeDistribution[i],
			];
		}

		const codes = [];
		for (let i = 0; i < count; i++) {
			const shortCode = uuid().split("-")[0].toUpperCase();
			codes.push({
				code: shortCode,
				batch: batchNumber,
				prize: prizeDistribution[i],
			});
		}

		// insert all at once
		const saved = await ScratchCode.insertMany(codes);

		// attach QR codes
		const withQRCodes = await Promise.all(
			saved.map(async (c) => {
				const qrImage = await QRCode.toDataURL(c.code);
				return { ...c.toObject(), qrImage };
			})
		);

		// Shuffle the final array before sending to ensure random order
		for (let i = withQRCodes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[withQRCodes[i], withQRCodes[j]] = [withQRCodes[j], withQRCodes[i]];
		}

		return res.json({ success: true, data: withQRCodes });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// redeem code
export const redeemScratchCode = async (req, res) => {
	try {
		const { scratchCode } = req.body;

		// 1. Find the code in the database
		const code = await ScratchCode.findOne({ code: scratchCode });

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

		// Distinct batches
		const batches = await ScratchCode.distinct("batch");

		const codes =
			selectedBatch && selectedBatch !== ""
				? await ScratchCode.find({ batch: selectedBatch }).select("-prize").lean()
				: await ScratchCode.find({ batch: batches[0] }).select("-prize").lean();

		// Generate all QR codes in parallel
		const withQRCodes = await Promise.all(
			codes.map(async (c) => {
				const qrImage = await QRCode.toDataURL(c.code);
				return { ...c, qrImage };
			})
		);

		// Shuffle
		for (let i = withQRCodes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[withQRCodes[i], withQRCodes[j]] = [withQRCodes[j], withQRCodes[i]];
		}

		return res
			.status(200)
			.json({ success: true, data: { withQRCodes, batches } });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

// update redeemer (I see this is named addRedeemer in the code)
export const updateRedeemer = async (req, res) => {
	try {
		const { redeemer, code } = req.body;

		if (!redeemer || !code) {
			return res.status(400).json({
				success: false,
				message: "Redeemer ID and code are required.",
			});
		}

		// Find the scratch code and update it only if it has not been redeemed yet.
		const updatedCode = await ScratchCode.findOneAndUpdate(
			{ code: code, redeemed: true, redeemedBy: { $exists: false } },
			{ redeemedBy: redeemer },
			{ new: true } // Return the updated document
		);

		if (!updatedCode) {
			return res.status(404).json({
				success: false,
				message:
					"Scratch code not found, or it has already been assigned to a winner.",
			});
		}

		return res.status(200).json({ success: true, data: updatedCode });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};
