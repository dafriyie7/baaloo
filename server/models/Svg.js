import mongoose from "mongoose";

/**
 * One uploaded SVG per (type, name). `type` is a theme slug; `name` is stored
 * lowercase (a–z, 0–9, _) and lines up with symbol lookups.
 */
const svgSchema = new mongoose.Schema(
	{
		type: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			maxlength: 64,
		},
		name: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			maxlength: 32,
		},
		/** Public path served by Express static, e.g. /uploads/svgs/fruit/a.svg */
		urlPath: { type: String, required: true },
		originalFileName: { type: String, default: "" },
	},
	{ timestamps: true }
);

svgSchema.index({ type: 1, name: 1 }, { unique: true });
svgSchema.index({ type: 1 });

const Svg = mongoose.models.Svg || mongoose.model("Svg", svgSchema);

export default Svg;
