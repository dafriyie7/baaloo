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
import adminAuth from "../middleware/adminAuth.js";

const scratchCodeRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

scratchCodeRouter
	.post("/generate-structured", adminAuth, generateBatchStructured)
	.post("/generate-price-tag", adminAuth, generatePriceTagBatch)
	.post("/redeem", redeemScratchCode)
	.get("/batches", adminAuth, listBatches)
	.delete("/batches/:id", adminAuth, deleteBatch)
	.get("/get", adminAuth, getAllScratchCodes)
	.get("/export/:id", adminAuth, exportBatchCodes)
	.post("/audit", adminAuth, upload.single("file"), auditBatchCodes);

export default scratchCodeRouter;


 