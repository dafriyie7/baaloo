import express from "express";
import { getAllTransactions, getTransactionStats } from "../controllers/transactionController.js";
import adminAuth from "../middleware/adminAuth.js";

const transactionRouter = express.Router();

transactionRouter.get("/get", adminAuth, getAllTransactions);
transactionRouter.get("/stats", adminAuth, getTransactionStats);

export default transactionRouter;
