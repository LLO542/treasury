import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogBySlug,
  getMyBlogs,
  publishBlog,
  updateBlog,
} from "../controllers/blog.controller.js";
import { optionalAuth, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes (with optional auth for admin filtering)
router.get("/", optionalAuth, getAllBlogs);

// Protected routes
router.get("/me", protect, getMyBlogs);
router.post("/", protect, createBlog);
router.patch("/:id", protect, updateBlog);
router.patch("/:id/publish", protect, publishBlog);
router.delete("/:id", protect, deleteBlog);

// Slug route must be last (catches all /:slug)
router.get("/:slug", optionalAuth, getBlogBySlug);

export default router;
