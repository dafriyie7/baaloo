import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
	{
		batchNumber: { type: String, required: true, unique: true },
		mechanicVersion: { type: Number, default: 2 },
		/** structured_v2 = R-tier + jackpot; price_tag_v1 = per-SVG prize + 3× / special jackpot */
		gameMode: {
			type: String,
			enum: ["structured_v2", "price_tag_v1"],
			default: "structured_v2",
		},

		costPerCode: { type: Number, required: true },
		totalCodes: { type: Number, required: true },
		giveawayPercentage: { type: Number, required: true },
		jackpotGiveawayPercentage: { type: Number, default: 0 },

		totalRevenue: { type: Number, default: 0 },
		totalPrizePool: { type: Number, default: 0 },
		jackpotPool: { type: Number, default: 0 },
		otherPrizePool: { type: Number, default: 0 },

		tierDistributionSnapshot: { type: mongoose.Schema.Types.Mixed },
		prizeTierWeightsSnapshot: { type: mongoose.Schema.Types.Mixed },
		tierCountsSnapshot: { type: mongoose.Schema.Types.Mixed },

		jackpotPrizeEach: { type: Number, default: 0 },
		/** Structured generation: sum of per-tier leftovers below one ticket (house margin) */
		marginRetainedFromPrizePool: { type: Number, default: 0 },
		/** Shown in admin: headline jackpot per ticket */
		winningPrize: { type: Number, default: 0 },

		symbolAlphabet: { type: String, default: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },
		/** Theme slug for uploaded SVGs (Svg.type); empty = alphabet-only tokens (A–Z default) */
		svgThemeType: { type: String, default: "", trim: true, maxlength: 64 },
	},
	{ timestamps: true }
);

const Batch = mongoose.models.Batch || mongoose.model("Batch", batchSchema);

export default Batch;
