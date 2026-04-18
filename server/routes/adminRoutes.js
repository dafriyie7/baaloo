import express from "express";
import {
	loginUser,
	getManagementData,
	registerUser,
	updatePassword,
	updateUser,
	updateAdminById,
	updateAdminPasswordById,
	deleteAdminById,
	getAllAdmins,
	logoutUser,
	checkAuth,
} from "../controllers/adminController.js";
import { getAuditLogs } from "../controllers/auditLogController.js";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const authRouter = express.Router();

authRouter
	.post("/register", registerUser)
	.post("/login", loginUser)
	.patch("/update-user", adminAuth, updateUser)
	.patch("/update-password", adminAuth, updatePassword)
	.get("/stats", adminAuth, getManagementData)
	.get("/admins", adminAuth, getAllAdmins)
	.post("/logout", userAuth, logoutUser)
	.patch("/admins/:id", adminAuth, updateAdminById)
	.patch("/admins/:id/password", adminAuth, updateAdminPasswordById)
	.delete("/admins/:id", adminAuth, deleteAdminById)
	.get("/check-auth", userAuth, checkAuth)
	.get("/audit-logs", adminAuth, getAuditLogs);

export default authRouter;
