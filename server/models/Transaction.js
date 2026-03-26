import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
	{
		scratchCode: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ScratchCode",
			required: true,
			index: true,
		},
		player: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Player",
			index: true,
		},
		amount: { type: Number, required: true },
		phone: { type: String, required: true },
		currency: { type: String, required: true, default: "GHS" },
		type: {
			type: String,
			enum: ["payout"],
			required: true,
			default: "payout",
		},
		status: {
			type: String,
			enum: ["pending", "completed", "failed", "cancelled"],
			required: true,
			default: "pending",
		},
		gatewayTransactionId: { type: String, index: true, sparse: true },
		gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
		note: { type: String, default: "" },
		completedAt: { type: Date, default: null },
	},
	{ timestamps: true }
);

transactionSchema.index({ scratchCode: 1, status: 1 });

const Transaction =
	mongoose.models.Transaction ||
	mongoose.model("Transaction", transactionSchema);

export default Transaction;
