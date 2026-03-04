import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
} from "../controllers/blog.controller.js";
import { authorize, optionalAuth, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (with optional auth for admin filtering)
router.get("/", optionalAuth, getAllBlogs);
router.get("/:slug", optionalAuth, getBlogBySlug);

// Protected routes (admin only)
router.post("/", protect, authorize("admin"), createBlog);
router.patch("/:id", protect, authorize("admin"), updateBlog);
router.delete("/:id", protect, authorize("admin"), deleteBlog);

export default router;
