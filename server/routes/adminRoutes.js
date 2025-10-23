import express from "express";
import {
	loginUser,
	getManagementData,
	registerUser,
	updatePassword,
	updateUser,
} from "../controllers/adminController.js";
import userAuth from "../middleware/userAuth.js";

const authRouter = express.Router();

authRouter
	.post("/register", registerUser)
	.post("/login", loginUser)
	.patch("/update-user", userAuth, updateUser)
	.patch("/update-password", userAuth, updatePassword)
	.get("/manage", userAuth, getManagementData);

export default authRouter;
