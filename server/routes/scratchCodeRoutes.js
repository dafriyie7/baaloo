import express from "express";
import {
	generateBatch,
	getAllScratchCodes,
	printCodes,
	redeemScratchCode,
} from "../controllers/scratchCodeController.js";

const scratchCodeRouter = express.Router();

scratchCodeRouter
	.post("/generate", generateBatch)
	.post("/redeem", redeemScratchCode)
	.get("/get", getAllScratchCodes)
	.post("/print", printCodes)

export default scratchCodeRouter;
 