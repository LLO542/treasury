import mongoose from 'mongoose';

const workSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'],
    },
    summary: {
      type: String,
      required: true,
      maxlength: 500,
      trim: true,
    },
    mediaType: {
      type: String,
      required: true,
      enum: ['image', 'video'],
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
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

workSchema.virtual('preview').get(function preview() {
  return {
    id: this._id,
    title: this.title,
    mediaType: this.mediaType,
    mediaUrl: this.mediaUrl,
  };
});

export const Work = mongoose.model('Work', workSchema);
