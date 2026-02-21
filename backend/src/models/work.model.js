import mongoose from "mongoose";

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
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"],
    },
    description: {
      type: String,
      required: true,
      minlength: 40,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ["image", "video", "text"],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (value) => value.length <= 12,
        message: "A work can have at most 12 tags",
      },
    },
    media: {
      fileName: { type: String, required: true },
      mimeType: {
        type: String,
        required: true,
        match: [/^(image|video)\/.+$/, "Media must be image/* or video/*"],
      },
      fileSize: { type: Number, required: true, min: 1 },
      storagePath: { type: String, required: true },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, strict: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

workSchema.virtual("mediaUrl").get(function mediaUrl() {
  return `/api/media/${this._id}`;
});

export const Work = mongoose.model("Work", workSchema);
