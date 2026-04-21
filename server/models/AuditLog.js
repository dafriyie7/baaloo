import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		action: {
			type: String,
			required: true,
			index: true,
		},
		resource: {
			type: String, // e.g., "Batch", "ScratchCode"
			index: true,
		},
		resourceId: {
			type: String, // The ID of the affected resource
		},
		details: {
			type: mongoose.Schema.Types.Mixed, // flexible metadata
		},
		ipAddress: {
			type: String,
		},
		location: {
			type: String, // e.g., "Lagos, Nigeria"
		},
		browser: {
			type: String, // e.g., "Chrome"
		},
		os: {
			type: String, // e.g., "Windows"
		},
		userAgent: {
			type: String,
		},
	},
	{ timestamps: true }
);

// Index for performance on date ranges
AuditLogSchema.index({ createdAt: -1 });

const AuditLog =
	mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);

export default AuditLog;
