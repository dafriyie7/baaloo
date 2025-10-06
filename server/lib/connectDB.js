import mongoose from "mongoose";

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
		if (!process.env.MONGO_URI) {
			throw new Error(
				"MONGO_URI is not defined in the environment variables."
			);
		}

		// The connect promise resolves on a successful connection.
		await mongoose.connect(`${process.env.MONGO_URI}/baaloo`);
		console.log("Successfully connected to MongoDB.");
	} catch (error) {
		console.error("Failed to connect to MongoDB:", error.message);
		throw error;
	}
};

export default connectDB;
