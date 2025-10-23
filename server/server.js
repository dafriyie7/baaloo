import express from "express";
import cors from "cors";
import "dotenv/config";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB from "./lib/connectDB.js";
import playerRouter from "./routes/playersRoutes.js";
import scratchCodeRouter from "./routes/scratchCodeRoutes.js";
import authRouter from "./routes/authRouter.js";

const PORT = process.env.PORT;

const app = express();

app.use(cookieParser());

const allowedOrigins = ["http://localhost:5173", "https://baaloo.vercel.app"];
app.use(express.json())
	.use(morgan("combined"))
	.use(
		cors({
			origin: allowedOrigins,
			credentials: true,
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		})
	);

app.get("/", (req, res) => res.send("server running"));

app.use("/api/players", playerRouter)
	.use("/api/scratch-codes", scratchCodeRouter)
	.use("/api/auth", authRouter);

const startServer = async () => {
	try {
		await connectDB();

		app.listen(PORT, () =>
			console.log(`Server running on http://localhost:${PORT}`)
		);
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
};

startServer();
