import express from "express";
import multer from "multer";
import {
  createWork,
  deleteWork,
  getAllWorks,
  getWorkBySlug,
  streamMedia,
  updateWork,
} from "../controllers/work.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Configure multer for file uploads with temp storage
const upload = multer({
  dest: "temp/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"), false);
    }
  },
});

// Public routes
router.get("/", getAllWorks);
router.get("/:slug", getWorkBySlug);

// Protected routes (admin only)
router.post("/", protect, authorize("admin"), upload.single("media"), createWork);
router.patch("/:id", protect, authorize("admin"), updateWork);
router.delete("/:id", protect, authorize("admin"), deleteWork);

export default router;
