import express from "express";
const router = express.Router();
import { default as PingController } from "../controllers/PingController";

router.get("/ping", PingController.ping);

export default router;
