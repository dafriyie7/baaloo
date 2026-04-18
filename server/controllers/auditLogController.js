import AuditLog from "../models/AuditLog.js";

export const getAuditLogs = async (req, res) => {
	try {
		const { page = 1, limit = 50, action, user } = req.query;

		const query = {};
		if (action) query.action = action;
		if (user) query.user = user;

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
