import express from "express";
import multer from "multer";
import { generatePriceTagBatch } from "../controllers/priceTagBatchController.js";
import {
	auditBatchCodes,
	deleteBatch,
	exportBatchCodes,
	generateBatchStructured,
	getAllScratchCodes,
	listBatches,
	redeemScratchCode,
} from "../controllers/scratchCodeController.js";
import userAuth from "../middleware/userAuth.js";

const scratchCodeRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

scratchCodeRouter
	.post("/generate-structured", userAuth, generateBatchStructured)
	.post("/generate-price-tag", userAuth, generatePriceTagBatch)
	.post("/redeem", userAuth, redeemScratchCode)
	.get("/batches", userAuth, listBatches)
	.delete("/batches/:id", userAuth, deleteBatch)
	.get("/get", userAuth, getAllScratchCodes)
	.get("/export/:id", userAuth, exportBatchCodes)
	.post("/audit", userAuth, upload.single("file"), auditBatchCodes);

export default scratchCodeRouter;


 