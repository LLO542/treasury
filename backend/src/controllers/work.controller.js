import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { Work } from "../models/work.model.js";

const UPLOADS_DIR = path.resolve("uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const createWork = async (req, res) => {
  try {
    const { title, slug, description, type, tags } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "Media file is required" });
    }

    const storagePath = path.join(UPLOADS_DIR, `${Date.now()}-${file.originalname}`);
    
    // Stream file to disk to minimize RAM usage
    const readStream = fs.createReadStream(file.path);
    const writeStream = fs.createWriteStream(storagePath);
    await pipeline(readStream, writeStream);

    // Clean up temp file
    fs.unlinkSync(file.path);

    const work = await Work.create({
      title,
      slug,
      description,
      type,
      tags: tags ? JSON.parse(tags) : [],
      media: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storagePath,
      },
      owner: req.user._id,
    });

    return res.status(201).json({
      message: "Work created successfully",
      work,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Slug already exists" });
    }
    throw error;
  }
};

export const getAllWorks = async (req, res) => {
  const { type, tags, search, page = 1, limit = 12 } = req.query;
  
  const filter = {};
  
  if (type) {
    filter.type = type;
  }
  
  if (tags) {
    filter.tags = { $in: tags.split(",") };
  }
  
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const [works, total] = await Promise.all([
    Work.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("owner", "name")
      .lean(),
    Work.countDocuments(filter),
  ]);

  return res.status(200).json({
    works,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

export const getWorkBySlug = async (req, res) => {
  const { slug } = req.params;
  
  const work = await Work.findOne({ slug }).populate("owner", "name").lean();
  
  if (!work) {
    return res.status(404).json({ message: "Work not found" });
  }

  return res.status(200).json({ work });
};

export const updateWork = async (req, res) => {
  const { id } = req.params;
  const { title, description, tags } = req.body;

  const work = await Work.findById(id);
  
  if (!work) {
    return res.status(404).json({ message: "Work not found" });
  }

  if (work.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (title) work.title = title;
  if (description) work.description = description;
  if (tags) work.tags = JSON.parse(tags);

  await work.save();

  return res.status(200).json({
    message: "Work updated successfully",
    work,
  });
};

export const deleteWork = async (req, res) => {
  const { id } = req.params;

  const work = await Work.findById(id);
  
  if (!work) {
    return res.status(404).json({ message: "Work not found" });
  }

  if (work.owner.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  // Delete file from storage
  if (fs.existsSync(work.media.storagePath)) {
    fs.unlinkSync(work.media.storagePath);
  }

  await Work.findByIdAndDelete(id);

  return res.status(200).json({ message: "Work deleted successfully" });
};

// Stream media file with proper Content-Type
export const streamMedia = async (req, res) => {
  const { id } = req.params;

  const work = await Work.findById(id).lean();
  
  if (!work) {
    return res.status(404).json({ message: "Work not found" });
  }

  const filePath = work.media.storagePath;
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Media file not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Set correct Content-Type
  res.setHeader("Content-Type", work.media.mimeType);

  if (range) {
    // Support range requests for video streaming
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
    });

    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);
  } else {
    res.setHeader("Content-Length", fileSize);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
};

// Get upload progress (for parallel upload tracking)
export const getUploadProgress = async (req, res) => {
  const { jobId } = req.params;
  
  // In a real implementation, this would check a job queue
  // For now, return mock progress
  return res.status(200).json({
    jobId,
    status: "completed",
    progress: 100,
  });
};
