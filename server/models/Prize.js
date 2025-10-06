const PrizeSchema = new mongoose.Schema({
	title: String, // e.g. "Free Data", "Cash ₵10", "Discount Coupon"
	description: String,
	value: Number, // optional numeric value
	createdAt: { type: Date, default: Date.now },
});

const Prize =
	mongoose.models.Prize || mongoose.model("Prize", prizeSchema);

export default Prize