import express from "express";
import cors from "cors";
import connectDB from "./lib/connectDB.js";
import "dotenv/config";
import playerRouter from "./routes/playersRoutes.js";
import scratchCodeRouter from "./routes/scratchCodeRoutes.js";

const PORT = 4000;

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => res.send("server running"));

app.use("/api/players", playerRouter).use(
	"/api/scratch-codes",
	scratchCodeRouter
);

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
