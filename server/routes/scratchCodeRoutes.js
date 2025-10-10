import express from "express";
import {
	updateRedeemer,
	generateBatch,
	getAllScratchCodes,
	redeemScratchCode,
} from "../controllers/scratchCodeController.js";

const scratchCodeRouter = express.Router();

scratchCodeRouter
	.post("/generate", generateBatch)
	.post("/redeem", redeemScratchCode)
	.get("/get", getAllScratchCodes)
	// .patch("/update-redeemer", updateRedeemer);

export default scratchCodeRouter;
 