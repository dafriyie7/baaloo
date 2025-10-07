import express from "express";
import { addPlayer, getAllPlayers } from "../controllers/PlayerController.js";

const playerRouter = express.Router();

playerRouter.post("/add", addPlayer);
playerRouter.get("/get", getAllPlayers);

export default playerRouter;
