import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Batch from "../models/Batch.js";
import ScratchCode from "../models/ScratchCode.js";
import Player from "../models/Player.js";
import AuditLog from "../models/AuditLog.js";
import { logAudit } from "../lib/auditLogger.js";

// register a new user
export const registerUser = async (req, res) => {
	try {
		const { name, email, phone, password } = req.body;

		if (!name || !email || !phone || !password) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}

		const userExists = await User.findOne({ $or: [{ email }, { phone }] });

		if (userExists) {
			return res.status(400).json({
				success: false,
				message: "User with this email or phone already exists",
			});
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = new User({
			name,
			email,
			phone,
			password: hashedPassword,
		});

		await newUser.save();

		await logAudit(req, "REGISTER_ADMIN", {
			resource: "User",
			resourceId: newUser._id,
			details: { name: newUser.name, email: newUser.email },
		});

		return res.status(201).json({
			success: true,
			message: "User created successfully",
		});
	} catch (error) {
		console.log("register user error: ", error);
		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

// login user
export const loginUser = async (req, res) => {
	try {
		const { identifier, password } = req.body;

		if (!identifier || !password) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}

		const user = await User.findOne({
			$or: [{ email: identifier }, { phone: identifier }],
		});

		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

		res.cookie("token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		const sanitizedUser = user.toObject();
		delete sanitizedUser.password;

		await logAudit(req, "LOGIN", {
			userId: user._id,
			details: { email: user.email },
		});

		res.status(200).json({
			success: true,
			message: "User logged in successfully",
			user: sanitizedUser,
		});
	} catch (error) {
		console.error("login user error:", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// logout user
export const logoutUser = async (req, res) => {
	try {
		// Clear the authentication cookie
		res.clearCookie("token", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
		});

		await logAudit(req, "LOGOUT");

		// Respond with success
		return res
			.status(200)
			.json({ success: true, message: "Logged out successfully" });
	} catch (error) {
		console.error("logout user error: ", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// reset password
export const resetPassword = async (req, res) => {
	try {
		const { email } = req.body;

		if (!email) {
			return res.status(400).json({
				success: false,
				message: "Email is required",
			});
		}

		const user = await User.findOne({ email });

		if (!user) {
			return res.staus(404).json({
				success: false,
				message: "User does not exist",
			});
		}
	} catch (error) {
		console.log("reset password error: ", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// update password
export const updatePassword = async (req, res) => {
	try {
		const id = req.userId;
		const { oldPassword, newPassword } = req.body;

		if (!oldPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}

		const user = await User.findById(id);

		const isMatch = await bcrypt.compare(oldPassword, user.password);

		if (!isMatch) {
			return res.status(400).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);

		user.password = hashedPassword;

		await user.save();

		await logAudit(req, "UPDATE_PASSWORD", {
			resource: "User",
			resourceId: user._id,
		});

		return res.status(200).json({
			success: true,
			message: "Password updated successfully",
		});
	} catch (error) {
		console.log("update password error: ", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// Update user
export const updateUser = async (req, res) => {
	try {
		const id = req.userId;
		const updates = req.body;

		// Prevent password change through this route (optional)
		if (updates.password) delete updates.password;

		const updatedUser = await User.findByIdAndUpdate(id, updates, {
			new: true, // return updated doc
			runValidators: true, // apply schema validation
		});

		if (!updatedUser)
			return res
				.status(404)
				.json({ success: false, message: "User not found" });

		res.json({ success: true, data: updatedUser });
	} catch (err) {
		console.error("Update user error: ", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// get user profile
export const getUserProfile = async (req, res) => {
	try {
		const { id } = req.userId;

		const user = await User.findById(id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.log("get user error: ", error);
		res.status(500).json({ success: false, message: error.message });
	}
};

// update admin by id
export const updateAdminById = async (req, res) => {
	try {
		const { id } = req.params;
		const updates = req.body;

		// Prevent password change through this route
		if (updates.password) delete updates.password;

		const updatedAdmin = await User.findByIdAndUpdate(id, updates, {
			new: true,
			runValidators: true,
		}).select("-password");

		if (!updatedAdmin) {
			return res
				.status(404)
				.json({ success: false, message: "Admin not found" });
		}

		res.json({ success: true, data: updatedAdmin });
	} catch (err) {
		console.error("Update admin error: ", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// update admin password by id
export const updateAdminPasswordById = async (req, res) => {
	try {
		const { id } = req.params;
		const { newPassword } = req.body;

		if (!newPassword) {
			return res
				.status(400)
				.json({ success: false, message: "New password is required" });
		}

		const hashedPassword = await bcrypt.hash(newPassword, 10);

		await User.findByIdAndUpdate(id, { password: hashedPassword });

		res.json({ success: true, message: "Password updated successfully" });
	} catch (err) {
		console.error("Update admin password error: ", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// delete admin by id
export const deleteAdminById = async (req, res) => {
	try {
		const { id } = req.params;
		await User.findByIdAndDelete(id);

		await logAudit(req, "DELETE_ADMIN", {
			resource: "User",
			resourceId: id,
		});

		res.json({ success: true, message: "Admin removed successfully" });
	} catch (err) {
		console.error("Delete admin error: ", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

const r2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// get management data for dashboard
export const getManagementData = async (req, res) => {
	try {
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

		const [
			totalBatches,
			totalCodes,
			totalPlayers,
			admins,
			recentLogs,
			batchRollup,
			realizedRevAgg,
			revenueLast7dAgg,
			prizeAgg,
		] = await Promise.all([
			Batch.countDocuments(),
			ScratchCode.countDocuments(),
			Player.countDocuments(),
			User.find().select("-password"),
			AuditLog.find()
				.populate("user", "name email")
				.sort({ createdAt: -1 })
				.limit(5),
			Batch.aggregate([
				{
					$group: {
						_id: null,
						totalBookedRevenue: {
							$sum: { $ifNull: ["$totalRevenue", 0] },
						},
						totalPrizePoolCommitted: {
							$sum: { $ifNull: ["$totalPrizePool", 0] },
						},
						totalMarginRetainedPlanned: {
							$sum: { $ifNull: ["$marginRetainedFromPrizePool", 0] },
						},
					},
				},
			]),
			ScratchCode.aggregate([
				{ $match: { isUsed: true } },
				{
					$lookup: {
						from: "batches",
						localField: "batchNumber",
						foreignField: "_id",
						as: "b",
					},
				},
				{ $unwind: "$b" },
				{ $group: { _id: null, total: { $sum: "$b.costPerCode" } } },
			]),
			ScratchCode.aggregate([
				{
					$match: {
						isUsed: true,
						redeemedAt: { $gte: sevenDaysAgo },
					},
				},
				{
					$lookup: {
						from: "batches",
						localField: "batchNumber",
						foreignField: "_id",
						as: "b",
					},
				},
				{ $unwind: "$b" },
				{ $group: { _id: null, total: { $sum: "$b.costPerCode" } } },
			]),
			ScratchCode.aggregate([
				{ $match: { isUsed: true, isWinner: true } },
				{
					$group: {
						_id: null,
						total: { $sum: { $ifNull: ["$prizeAmount", 0] } },
					},
				},
			]),
		]);

		const br = batchRollup[0] || {};
		const totalBookedRevenue = r2(br.totalBookedRevenue);
		const totalPrizePoolCommitted = r2(br.totalPrizePoolCommitted);
		const totalMarginRetainedPlanned = r2(br.totalMarginRetainedPlanned);
		const stickerMarginBooked = r2(
			totalBookedRevenue - totalPrizePoolCommitted
		);
		const revenueFromRedemptions = r2(realizedRevAgg[0]?.total);
		const revenueLast7Days = r2(revenueLast7dAgg[0]?.total);
		const totalPrizePaid = r2(prizeAgg[0]?.total);
		const netCashFromPlayedTickets = r2(
			revenueFromRedemptions - totalPrizePaid
		);
		const realizedVsBookedPct =
			totalBookedRevenue > 0
				? Math.min(
						100,
						Math.round(
							(revenueFromRedemptions / totalBookedRevenue) * 1000
						) / 10
					)
				: 0;
		const prizePoolShareOfBookedPct =
			totalBookedRevenue > 0
				? Math.round(
						(totalPrizePoolCommitted / totalBookedRevenue) * 1000
					) / 10
				: 0;
		const stickerShareOfBookedPct =
			Math.round((100 - prizePoolShareOfBookedPct) * 10) / 10;

		const stats = {
			totalBatches,
			totalCodes,
			totalPlayers,
			totalAdmins: admins.length,
			totalBookedRevenue,
			totalPrizePoolCommitted,
			stickerMarginBooked,
			totalMarginRetainedPlanned,
			revenueFromRedemptions,
			revenueLast7Days,
			totalPrizePaid,
			netCashFromPlayedTickets,
			realizedVsBookedPct,
			prizePoolShareOfBookedPct,
			stickerShareOfBookedPct,
		};

		res.status(200).json({
			success: true,
			data: {
				stats,
				admins,
				recentLogs,
			},
		});
	} catch (error) {
		console.error("Get management data error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// get all admins
export const getAllAdmins = async (req, res) => {
	try {
		const admins = await User.find().select("-password");
		res.status(200).json({
			success: true,
			data: admins,
		});
	} catch (error) {
		console.error("Get all admins error:", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// check auth
export const checkAuth = async (req, res) => {
	try {
		const id = req.userId;
		const user = await User.findById(id);

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		console.error("checkAuth error:", error);
		res.status(500).json({
			success: false,
			message: "Server error during authentication check.",
		});
	}
};
