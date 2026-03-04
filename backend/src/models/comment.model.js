import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Reference to the blog post this comment belongs to
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    // Reference to parent comment for nested replies
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    // Depth level for limiting nesting (0 = root, max 5-6 levels)
    depth: {
      type: Number,
      default: 0,
      max: 6,
    },
  },
  { timestamps: true, strict: true }
);

// Index for efficient querying of comments by blog
commentSchema.index({ blog: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

export const Comment = mongoose.model("Comment", commentSchema);
