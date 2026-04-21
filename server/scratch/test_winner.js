import "dotenv/config";
import mongoose from "mongoose";
import ScratchCode from "../models/ScratchCode.js";
import Batch from "../models/Batch.js";
import { hashForLookup } from "../lib/encryption.js";

async function createTestWinner() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const batch = await Batch.findOne();
    if (!batch) {
        console.error("No batch found in database. Create a batch first.");
        process.exit(1);
    }
    
    const testCode = "ACE777";
    const lookupHash = hashForLookup(testCode);
    
    // Cleanup existing
    await ScratchCode.deleteOne({ lookupHash });
    
    await ScratchCode.create({
        batchNumber: batch._id,
        code: `test_winner_${Date.now()}`, 
        symbolTokens: ["A", "A", "A", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
        lookupHash,
        tier: "t3",
        prizeAmount: 2.50, // 2.50 GHS
        isWinner: true,
        isUsed: false,
        payoutStatus: "pending"
    });
    
    console.log("-----------------------------------------");
    console.log("TEST WINNER CREATED!");
    console.log("Code: ACE777");
    console.log("-----------------------------------------");
    
    process.exit();
}

createTestWinner();
