import express from "express";
import { addWinner, getAllWinners } from "../controllers/winnersController.js";

const winnerRouter = express.Router();

winnerRouter.post("/add", addWinner);
winnerRouter.get("/get", getAllWinners);

export default winnerRouter;
