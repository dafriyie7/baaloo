import express from "express";
import {
	loginUser,
	registerUser,
	updatePassword,
	updateUser,
} from "../controllers/usercontroller.js";
import userAuth from "../middleware/userAuth.js";

const authRouter = express.Router();

authRouter
	.post("/register", registerUser)
	.post("/login", loginUser)
	.patch("/update-user", userAuth, updateUser)
	.patch("/update-password", userAuth, updatePassword);

export default authRouter;
