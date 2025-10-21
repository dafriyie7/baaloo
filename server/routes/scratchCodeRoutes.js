import express from "express";
import {
	generateBatch,
	getAllScratchCodes,
	redeemScratchCode,
} from "../controllers/scratchCodeController.js";

const scratchCodeRouter = express.Router();

scratchCodeRouter
	.post("/generate", generateBatch)
	.post("/redeem", redeemScratchCode)
	.get("/get", getAllScratchCodes)

export default scratchCodeRouter;
 