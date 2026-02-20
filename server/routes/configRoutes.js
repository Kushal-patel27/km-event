import express from "express";
import { getPublicSystemConfig } from "../controllers/systemConfigController.js";

const router = express.Router();

router.get("/public", getPublicSystemConfig);

export default router;
