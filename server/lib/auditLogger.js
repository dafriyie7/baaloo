import AuditLog from "../models/AuditLog.js";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";

/**
 * Centrally logs administrative and sensitive actions to the AuditLog collection.
 * @param {Object} req - The Express request object (to extract user and IP info).
 * @param {string} action - The action name (e.g., "EXPORT_CODES").
 * @param {Object} context - Optional data like { resource: "Batch", resourceId: "...", details: {} }.
 */
export const logAudit = async (req, action, { resource, resourceId, details, userId: manualUserId } = {}) => {
	try {
		// Priority: manually passed ID (for login), then req.user, then req.userId (some middlewares use this)
		const userId = manualUserId || req.user?._id || req.user?.id || req.userId;
		if (!userId) return;

		const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
		const userAgent = req.headers["user-agent"];

		// Resolve Location
		let location = "Unknown";
		if (ip && ip !== "127.0.0.1" && ip !== "::1") {
			const geo = geoip.lookup(ip);
			if (geo) {
				location = `${geo.city ? geo.city + ", " : ""}${geo.country}`;
			}
		} else if (ip === "127.0.0.1" || ip === "::1") {
			location = "Localhost";
		}

		// Parse User Agent
		const parser = new UAParser(userAgent);
		const browserInfo = parser.getBrowser();
		const osInfo = parser.getOS();
		const browser = browserInfo.name ? `${browserInfo.name} ${browserInfo.version}` : "Unknown Browser";
		const os = osInfo.name ? `${osInfo.name} ${osInfo.version}` : "Unknown OS";

		await AuditLog.create({
			user: userId,
			action,
			resource,
			resourceId,
			details,
			ipAddress: ip,
			location,
			browser,
			os,
			userAgent,
		});
	} catch (error) {
		// We don't want to crash the request if logging fails, but we should know about it.
		console.error("Critical: Audit Log Failure:", error);
	}
};
