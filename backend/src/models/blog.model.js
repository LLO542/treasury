import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"],
    },
    excerpt: {
      type: String,
      required: true,
      minlength: 40,
      maxlength: 280,
    },
    content: {
      type: String,
      required: true,
      minlength: 120,
    },
    coverImage: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    publishedAt: Date,
  },
  { timestamps: true, strict: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

blogSchema.virtual("readingTimeMinutes").get(function readingTimeMinutes() {
  const words = this.content?.trim().split(/\s+/).filter(Boolean).length || 0;
  return Math.max(1, Math.ceil(words / 220));
});

blogSchema.pre("save", function setPublishedAt(next) {
  if (this.isModified("status") && this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export const Blog = mongoose.model("Blog", blogSchema);
