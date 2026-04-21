import express from "express";
import { getAllTransactions, getTransactionStats, syncTransactionStatus, getGatewayDetails } from "../controllers/transactionController.js";
import adminAuth from "../middleware/adminAuth.js";

const transactionRouter = express.Router();

transactionRouter.get("/get", adminAuth, getAllTransactions);
transactionRouter.get("/stats", adminAuth, getTransactionStats);
transactionRouter.post("/sync/:id", adminAuth, syncTransactionStatus);
transactionRouter.get("/gateway-details/:id", adminAuth, getGatewayDetails);

export default transactionRouter;
