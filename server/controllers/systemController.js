import SystemSetting from "../models/SystemSetting.js";
import { logAudit } from "../lib/auditLogger.js";

export const getSystemSettings = async (req, res) => {
	try {
		const settings = await SystemSetting.getSettings();
		res.status(200).json({ success: true, settings });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

export const updateSystemSettings = async (req, res) => {
	try {
		const { payoutsEnabled, maintenanceMode, allowNewRedemptions } = req.body;
		
		const settings = await SystemSetting.getSettings();
		
		const oldSettings = { ...settings.toObject() };

		if (payoutsEnabled !== undefined) settings.payoutsEnabled = payoutsEnabled;
		if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
		if (allowNewRedemptions !== undefined) settings.allowNewRedemptions = allowNewRedemptions;
		
		settings.updatedBy = req.user._id;
		await settings.save();

		// Log the changes
		await logAudit(req, "UPDATE_SETTINGS", {
			resource: "SystemSetting",
			resourceId: settings._id,
			details: `Updated system settings. Payouts: ${settings.payoutsEnabled}, Maintenance: ${settings.maintenanceMode}, Redemptions: ${settings.allowNewRedemptions}`,
		});

		res.status(200).json({ success: true, settings });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
