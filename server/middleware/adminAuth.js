import jwt from "jsonwebtoken";
import User from "../models/User.js";

const adminAuth = async (req, res, next) => {
	try {
		const token = req.cookies?.token;

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Access denied. Please login.",
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		if (!decoded?.id) {
			return res.status(401).json({
				success: false,
				message: "Invalid token. Please login again.",
			});
		}

		// Security Hardening: Fetch user and verify admin role
		const user = await User.findById(decoded.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		if (user.role !== "admin") {
			return res.status(403).json({
				success: false,
				message: "Unauthorized. Admin role required.",
			});
		}

		req.userId = decoded.id;
		req.user = user; // Attach user object for convenience

		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: "Authentication failed. " + error.message,
		});
	}
};

export default adminAuth;
