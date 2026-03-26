import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import { httpLogger, logger } from "./lib/logger.js";
import connectDB from "./lib/connectDB.js";
import playerRouter from "./routes/playersRoutes.js";
import scratchCodeRouter from "./routes/scratchCodeRoutes.js";
import authRouter from "./routes/adminRoutes.js";
import svgRouter from "./routes/svgRoutes.js";
import { handleShikaWebhook } from "./controllers/scController.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT;

const app = express();

const defaultAllowedOrigins = [
	"http://localhost:3000",
	"http://localhost:4173",
	"http://localhost:5173",
	"https://baaloo.vercel.app",
];
const envAllowedOrigins = String(process.env.CORS_ORIGINS || "")
	.split(",")
	.map((v) => v.trim())
	.filter(Boolean);
const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];
app.use(express.json())
	.use(httpLogger)
	.use(
		cors({
			origin: allowedOrigins,
			credentials: true,
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		})
);
	
app.use(cookieParser());

app.get("/", (req, res) => res.send("server running"));

// Shika webhook: must use raw body for signature verification; handle here so body is not parsed by express.json()
app.get('/api/shika-webhook', (req, res) => {
	res.status(200).json({ ok: true, message: 'Shika webhook endpoint is reachable; use POST for events.' });
});
app.post(
	'/api/shika-webhook',
	express.raw({ type: 'application/json' }),
	handleShikaWebhook,
);

app.use(
	"/uploads",
	express.static(path.join(__dirname, "uploads"), {
		maxAge: "7d",
		immutable: false,
	})
);

app.use("/api/players", playerRouter)
	.use("/api/scratch-codes", scratchCodeRouter)
	.use("/api/auth", authRouter)
	.use("/api/svgs", svgRouter);

const startServer = async () => {
	try {
		await connectDB();

		app.listen(PORT, () =>
			logger.info(`Server listening on http://localhost:${PORT}`)
		);
	} catch (error) {
		const msg = `Failed to start server: ${error?.message ?? error}`;
		logger.error(
			error?.stack ? `${msg}\n${error.stack}` : msg
		);
		process.exit(1);
	}
};

startServer();
