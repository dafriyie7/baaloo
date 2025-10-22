import express from "express";
import {
	loginUser,
	registerUser,
	updatePassword,
	updateUser,
} from "../controllers/usercontroller.js";

const adminRouter = express.Router();

adminRouter
	.post("/register", registerUser)
	.post("/login", loginUser)
	.put("/update/:id", updateUser)
	.put("/update-password", updatePassword);

export default adminRouter;
