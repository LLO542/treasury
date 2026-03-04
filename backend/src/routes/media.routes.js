import express from "express";
import { streamMedia } from "../controllers/work.controller.js";

const router = express.Router();

// Stream media files with proper Content-Type
router.get("/:id", streamMedia);

export default router;
