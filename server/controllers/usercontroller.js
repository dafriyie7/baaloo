import User from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// register a new user
export const registerUser = async (req, res) => {
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
};

// login user
export const loginUser = async (req, res) => {
	const { identifier, password } = req.body;

	if (!identifier || !password) {
		return res.status(400).json({
			success: false,
			message: "All fields are required",
		});
	}

	// Find user by either email or phone number
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
		sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});

	res.status(200).json({
		success: true,
		message: "User logged in successfully",
		user: {
			id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		},
	});
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
		// Handle server errors
		res.status(500).json({ success: false, message: error.message });
	}
};

// reset password
export const resetPassword = async (req, res) => {
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
};

// update password
export const updatePassword = async (req, res) => {
	const { id } = req.userId;
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
};

// Update user
export const updateUser = async (req, res) => {
	try {
		const { id } = req.userId;
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
		console.error("Update user error:", err);
		res.status(500).json({ success: false, message: "Server error" });
	}
};
