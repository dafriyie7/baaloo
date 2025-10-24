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
import userAuth from "../middleware/userAuth.js";

const authRouter = express.Router();

authRouter
	.post("/register", registerUser)
	.post("/login", loginUser)
	.patch("/update-user", userAuth, updateUser)
	.patch("/update-password", userAuth, updatePassword)
	.get("/stats", userAuth, getManagementData)
	.get("/admins", userAuth, getAllAdmins)
	.post("/logout", userAuth, logoutUser)
	.patch("/admins/:id", userAuth, updateAdminById)
	.patch("/admins/:id/password", userAuth, updateAdminPasswordById)
	.delete("/admins/:id", userAuth, deleteAdminById)
	.get("/check-auth", userAuth, checkAuth);

export default authRouter;
