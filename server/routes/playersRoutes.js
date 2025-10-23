import express from "express";
import { addPlayer, getAllPlayers } from "../controllers/PlayerController.js";
import userAuth from "../middleware/userAuth.js";

const playerRouter = express.Router();

playerRouter.post("/add", userAuth, addPlayer);
playerRouter.get("/get", userAuth, getAllPlayers);

export default playerRouter;
