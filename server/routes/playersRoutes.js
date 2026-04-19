import express from "express";
import { addPlayer, claimWin, getAllPlayers, markAsPaid } from "../controllers/PlayerController.js";
import userAuth from "../middleware/userAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const playerRouter = express.Router();

playerRouter.post("/add", addPlayer);
playerRouter.post("/claim-win", claimWin);
playerRouter.get("/get", adminAuth, getAllPlayers);
playerRouter.post("/claim/:id", adminAuth, markAsPaid);

export default playerRouter;
