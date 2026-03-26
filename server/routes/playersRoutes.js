import express from "express";
import { addPlayer, claimWin, getAllPlayers } from "../controllers/PlayerController.js";
import userAuth from "../middleware/userAuth.js";

const playerRouter = express.Router();

playerRouter.post("/add", addPlayer);
playerRouter.post("/claim-win", claimWin);
playerRouter.get("/get", userAuth, getAllPlayers);

export default playerRouter;
