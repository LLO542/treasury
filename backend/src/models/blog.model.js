import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'],
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
    content: {
      type: String,
      required: true,
      minlength: 100,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    coverImageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

blogSchema.virtual('estimatedReadingTime').get(function estimatedReadingTime() {
  const wordsPerMinute = 220;
  const wordCount = this.content ? this.content.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
});

export const Blog = mongoose.model('Blog', blogSchema);
