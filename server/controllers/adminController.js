import User from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Batch from "../models/Batch.js";
import ScratchCode from "../models/ScratchCode.js";
import Player from "../models/Player.js";

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
		res.json({ success: true, message: "Admin removed successfully" });
	} catch (err) {
		console.error("Delete admin error: ", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

// get management data for dashboard
export const getManagementData = async (req, res) => {
	try {
		const totalBatches = await Batch.countDocuments();
		const totalCodes = await ScratchCode.countDocuments();
		const totalPlayers = await Player.countDocuments();
		const admins = await User.find().select("-password");

		const stats = {
			totalBatches,
			totalCodes,
			totalPlayers,
			totalAdmins: admins.length,
		};

		res.status(200).json({
			success: true,
			data: {
				stats,
				admins,
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
