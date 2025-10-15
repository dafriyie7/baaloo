import mongoose from "mongoose"

const batchSchema = new mongoose.Schema(
	{
		batchNumber: { type: String, required: true, unique: true },
		costPerCode: { type: Number, required: true },
		totalCodes: { type: Number, required: true },
		giveawayPercentage: { type: Number, required: true },
		totalRevenue: { type: Number, default: 0 },
		totalPrizeBudget: { type: Number, default: 0 },
		winningPrize: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

const Batch = mongoose.models.Batch || mongoose.model("Batch", batchSchema)

export default Batch