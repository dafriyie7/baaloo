import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema(
	{
		payoutsEnabled: {
			type: Boolean,
			default: true,
		},
		maintenanceMode: {
			type: Boolean,
			default: false,
		},
		allowNewRedemptions: {
			type: Boolean,
			default: true,
		},
		updatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	},
	{ timestamps: true }
);

// Ensure only one settings document exists
systemSettingSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);

export default SystemSetting;
