import mongoose from "mongoose";
import Svg from "../models/Svg.js";

// Set up event listeners for the Mongoose connection singleton once.
const { connection } = mongoose;

connection.on("error", (err) => {
	console.error("MongoDB connection error:", err);
});

connection.on("disconnected", () => {
	console.log("Disconnected from MongoDB");
});

const connectDB = async () => {
	try {
		const raw = process.env.MONGO_URI?.trim();
		if (!raw) {
			throw new Error(
				"MONGO_URI is not defined in the environment variables."
			);
		}

		// If URI already has a database path (e.g. .../baaloo or .../baaloo?opts), use as-is.
		// Otherwise append /baaloo for shorthand URIs like mongodb://localhost:27017
		const hasDbPath = /^mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(raw);
		const uri = hasDbPath ? raw : `${raw.replace(/\/$/, "")}/baaloo`;

		await mongoose.connect(uri);
		console.log("Successfully connected to MongoDB.");

		// Drop indexes not declared on the schema (e.g. stale Svg compound indexes)
		// so inserts are governed by { type, name } only.
		try {
			await Svg.syncIndexes();
		} catch (syncErr) {
			console.error(
				"Svg.syncIndexes() failed — SVG uploads may hit duplicate-key errors until indexes are fixed:",
				syncErr.message
			);
		}
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error.message);
		throw error;
	}
};

export default connectDB;
