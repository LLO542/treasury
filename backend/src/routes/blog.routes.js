import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
} from "../controllers/blog.controller.js";
import { optionalAuth, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (with optional auth for admin filtering)
router.get("/", optionalAuth, getAllBlogs);
router.get("/:slug", optionalAuth, getBlogBySlug);

// Protected routes (any authenticated user can create, edit/delete own posts)
router.post("/", protect, createBlog);
router.patch("/:id", protect, updateBlog);
router.delete("/:id", protect, deleteBlog);

export default router;
