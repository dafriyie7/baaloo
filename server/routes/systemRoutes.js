import express from "express";
import { getSystemSettings, updateSystemSettings } from "../controllers/systemController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Publicly readable (so frontend can check status)
router.get("/settings", getSystemSettings);

// Protected updates
router.put("/settings", adminAuth, updateSystemSettings);

export default router;
