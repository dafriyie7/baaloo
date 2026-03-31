import express from "express";
import { generatePriceTagBatch } from "../controllers/priceTagBatchController.js";
import {
	deleteBatch,
	exportBatchCodes,
	generateBatchStructured,
	getAllScratchCodes,
	listBatches,
	redeemScratchCode,
} from "../controllers/scratchCodeController.js";
import userAuth from "../middleware/userAuth.js";

const scratchCodeRouter = express.Router();

scratchCodeRouter
	.post("/generate-structured", userAuth, generateBatchStructured)
	.post("/generate-price-tag", userAuth, generatePriceTagBatch)
	.post("/redeem", userAuth, redeemScratchCode)
	.get("/batches", userAuth, listBatches)
	.delete("/batches/:id", userAuth, deleteBatch)
	.get("/get", userAuth, getAllScratchCodes)
	.get("/export/:id", userAuth, exportBatchCodes);

export default scratchCodeRouter;

 