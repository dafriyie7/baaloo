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

		// Handle IP detection more robustly (Express 'trust proxy' helps here)
		let ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
		
		// If x-forwarded-for is a list, take the first one
		if (ip && ip.includes(",")) {
			ip = ip.split(",")[0].trim();
		}

		// Normalize IPv6 mapped IPv4
		if (ip && ip.startsWith("::ffff:")) {
			ip = ip.substring(7);
		}

		const userAgent = req.headers["user-agent"];

		// Resolve Location
		let location = "Unknown Origin";
		
		const isPrivateIP = (ipAddr) => {
			if (!ipAddr) return false;
			return /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|::1|fe80:)/.test(ipAddr);
		};

		if (isPrivateIP(ip)) {
			location = ip === "127.0.0.1" || ip === "::1" ? "Localhost" : "Private Network";
		} else if (ip) {
			const geo = geoip.lookup(ip);
			if (geo) {
				const parts = [];
				if (geo.city) parts.push(geo.city);
				if (geo.region && !geo.city) parts.push(geo.region); // fallback if city is missing
				if (geo.country) parts.push(geo.country);
				location = parts.join(", ");
			}
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
