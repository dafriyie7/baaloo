import "dotenv/config";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");
    const txs = await Transaction.find().sort({ createdAt: -1 }).limit(5);
    console.log("Recent Transactions:", JSON.stringify(txs, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
check();
