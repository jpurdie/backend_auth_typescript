const express = require("express");
const router = express.Router();
import { default as PingController } from "../controllers/PingController";

router.get("/ping", PingController.ping);

module.exports = router;
