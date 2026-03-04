import { Comment } from "../models/comment.model.js";
import { Blog } from "../models/blog.model.js";

// Create a new comment or reply
export const createComment = async (req, res) => {
  const { blogId } = req.params;
  const { content, parentCommentId } = req.body;

  // Verify blog exists
  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  let depth = 0;
  let parentComment = null;

  // If replying to a comment, get parent details
  if (parentCommentId) {
    parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }
    // Check depth limit (max 6 levels of nesting)
    if (parentComment.depth >= 6) {
      return res.status(400).json({ message: "Maximum reply depth reached" });
    }
    depth = parentComment.depth + 1;
  }

  const comment = await Comment.create({
    content,
    author: req.user._id,
    blog: blogId,
    parentComment: parentCommentId || null,
    depth,
  });

  // Populate author for response
  await comment.populate("author", "name");

  return res.status(201).json({
    message: "Comment created successfully",
    comment: {
      _id: comment._id,
      content: comment.content,
      author: comment.author,
      blog: comment.blog,
      parentComment: comment.parentComment,
      depth: comment.depth,
      createdAt: comment.createdAt,
      replies: [], // New comments have no replies yet
    },
  });
};

// Get all comments for a blog post (flat list - frontend will build tree)
export const getCommentsByBlog = async (req, res) => {
  const { blogId } = req.params;

  // Verify blog exists
  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  // Get all comments for this blog, sorted by creation date
  const comments = await Comment.find({ blog: blogId })
    .populate("author", "name")
    .sort({ createdAt: 1 })
    .lean();

  // Build nested structure in backend for convenience
  const commentMap = new Map();
  const rootComments = [];

  // First pass: create map of all comments with empty replies array
  comments.forEach((comment) => {
    commentMap.set(comment._id.toString(), {
      ...comment,
      replies: [],
    });
  });

  // Second pass: build tree structure
  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment._id.toString());
    if (comment.parentComment) {
      const parent = commentMap.get(comment.parentComment.toString());
      if (parent) {
        parent.replies.push(commentWithReplies);
      } else {
        // Parent was deleted, treat as root
        rootComments.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return res.status(200).json({
    comments: rootComments,
    total: comments.length,
  });
};

// Delete a comment (and all its replies)
export const deleteComment = async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  // Only author or admin can delete
  if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Delete all replies recursively
  const deleteReplies = async (parentId) => {
    const replies = await Comment.find({ parentComment: parentId });
    for (const reply of replies) {
      await deleteReplies(reply._id);
      await Comment.findByIdAndDelete(reply._id);
    }
  };

  await deleteReplies(commentId);
  await Comment.findByIdAndDelete(commentId);

  return res.status(200).json({ message: "Comment deleted successfully" });
};
