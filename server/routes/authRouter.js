import express from "express";
import {
	loginUser,
	registerUser,
	updatePassword,
	updateUser,
} from "../controllers/usercontroller.js";

const authRouter = express.Router();

authRouter
	.post("/register", registerUser)
	.post("/login", loginUser)
	.put("/update/:id", updateUser)
	.put("/update-password", updatePassword);

export default authRouter;
