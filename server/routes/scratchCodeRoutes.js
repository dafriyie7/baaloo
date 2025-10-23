import express from "express";
import {
	generateBatch,
	getAllScratchCodes,
	redeemScratchCode,
} from "../controllers/scratchCodeController.js";
import userAuth from "../middleware/userAuth.js";

const scratchCodeRouter = express.Router();

scratchCodeRouter
	.post("/generate", userAuth, generateBatch)
	.post("/redeem", userAuth, redeemScratchCode)
	.get("/get", userAuth, getAllScratchCodes)

export default scratchCodeRouter;
 