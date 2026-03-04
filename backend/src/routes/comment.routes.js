import express from "express";
import {
  createComment,
  deleteComment,
  getCommentsByBlog,
} from "../controllers/comment.controller.js";
import { optionalAuth, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get comments for a blog (public)
router.get("/blog/:blogId", optionalAuth, getCommentsByBlog);

// Create a comment (requires auth)
router.post("/blog/:blogId", protect, createComment);

// Delete a comment (requires auth - owner or admin)
router.delete("/:commentId", protect, deleteComment);

export default router;
