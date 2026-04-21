import AuditLog from "../models/AuditLog.js";

export const getAuditLogs = async (req, res) => {
	try {
		const { page = 1, limit = 20, action, user, startDate, endDate, search } = req.query;

		const query = {};
		if (action) query.action = action;
		if (user) query.user = user;
		
		if (startDate || endDate) {
			query.createdAt = {};
			if (startDate) query.createdAt.$gte = new Date(startDate);
			if (endDate) query.createdAt.$lte = new Date(endDate);
		}

		if (search && search.trim()) {
			const s = search.trim();
			const regex = { $regex: s, $options: "i" };
			
			// Find users whose name or email matches the search
			const User = (await import("../models/User.js")).default;
			const matchingUsers = await User.find({
				$or: [{ name: regex }, { email: regex }]
			}).select("_id");
			const userIds = matchingUsers.map(u => u._id);

			query.$or = [
				{ action: regex },
				{ resource: regex },
				{ location: regex },
				{ ipAddress: regex },
				{ user: { $in: userIds } }
			];
		}

		const logs = await AuditLog.find(query)
			.populate("user", "name email")
			.sort({ createdAt: -1 })
			.limit(Number(limit))
			.skip((Number(page) - 1) * Number(limit));

		const total = await AuditLog.countDocuments(query);

		res.status(200).json({
			success: true,
			data: logs,
			total,
			pages: Math.ceil(total / limit),
			currentPage: Number(page),
		});
	} catch (error) {
		console.error("Get Audit Logs Error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

export const logUiEvent = async (req, res) => {
	try {
		const { action, details } = req.body;
		
		const { logAudit } = await import("../lib/auditLogger.js");
		await logAudit(req, action, { details });

		res.status(200).json({ success: true });
	} catch (error) {
		console.error("Log UI Event Error:", error);
		res.status(500).json({ success: false });
	}
};
