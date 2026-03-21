import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
	{
		batchNumber: { type: String, required: true, unique: true },
		/** @deprecated Legacy v1 batches only */
		pattern: { type: [String], default: [] },
		mechanicVersion: { type: Number, default: 2 },

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
		/** Shown in admin / legacy: headline jackpot per ticket */
		winningPrize: { type: Number, default: 0 },

		symbolAlphabet: { type: String, default: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" },

		/** @deprecated Use totalPrizePool */
		totalPrizeBudget: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

const Batch = mongoose.models.Batch || mongoose.model("Batch", batchSchema);

export default Batch;
