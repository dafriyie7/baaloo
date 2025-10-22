import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
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

		// req.body.userId = decoded.id;
		req.userId = decoded.id;

		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: error.message,
		});
	}
};

export default userAuth;
