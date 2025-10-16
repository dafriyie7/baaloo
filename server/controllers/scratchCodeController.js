import ScratchCode from "../models/ScratchCode.js";
import Batch from "../models/Batch.js";
import { v4 as uuid } from "uuid";
import QRCode from "qrcode";

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

		// Shuffle winners (random positions)
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

		// Build all codes
		const codes = [];
		for (let i = 0; i < totalCodes; i++) {
			const shortCode = uuid().split("-")[0].toUpperCase();
			codes.push({
				code: shortCode,
				batchNumber: batch._id,
				isWinner: prizeDistribution[i],
				prize: prizeDistribution[i] ? winningPrize : 0,
			});
		}

		// Shuffle full array once before bulk insertion (fast)
		for (let i = codes.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[codes[i], codes[j]] = [codes[j], codes[i]];
		}

		// Insert all codes in randomized order
		const savedCodes = await ScratchCode.insertMany(codes);

		// Attach QR images
		const withQRCodes = await Promise.all(
			savedCodes.map(async (c) => {
				const qrImage = await QRCode.toDataURL(c.code);
				return { ...c.toObject(), qrImage };
			})
		);

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
		const { origin } = req.headers;

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 20;

		// Distinct batches
		const batches = await Batch.find();

		// Handle case where no batches exist
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
			.limit(limit * 1)
			.skip((page - 1) * limit)
			.select("-isWinner")
			.lean();

		const totalCodes = await ScratchCode.countDocuments(query);

		// Generate all QR codes in parallel
		const withQRCodes = await Promise.all(
			codes.map(async (c) => {
				const scanUrl = `${origin}/scratch/${c.code}`;
				const qrImage = await QRCode.toDataURL(scanUrl);
				return { ...c, qrImage };
			})
		);

		return res.status(200).json({
			success: true,
			data: {
				withQRCodes,
				batches,
				totalPages: Math.ceil(totalCodes / limit),
				currentPage: parseInt(page),
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ success: false, message: error.message });
	}
};

export const printCodes = async (req, res) => {
	try {
		const { selectedBatch, count } = req.body

		if (!selectedBatch || !count) { 
			return res.status(400).json({ success: false, message: "All fields are required." })
		}

		const toPrint = await ScratchCode.find({ batchNumber: selectedBatch, isPrinted: false }).limit(count)

		return res.status(200).json({ success: true, data: toPrint })

	} catch (error) {
		console.error(error)
		return res.status(500).json({ success: false, message: error.message })
	}
}