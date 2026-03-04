import { Blog } from "../models/blog.model.js";

export const createBlog = async (req, res) => {
  try {
    const { title, slug, excerpt, content, coverImage, status } = req.body;

    const blog = await Blog.create({
      title,
      slug,
      excerpt,
      content,
      coverImage,
      status: status || "draft",
      author: req.user._id,
    });

    return res.status(201).json({
      message: "Blog created successfully",
      blog,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Slug already exists" });
    }
    throw error;
  }
};

export const getAllBlogs = async (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  
  // Build aggregation pipeline for searching including author name
  const pipeline = [];
  
  // Match stage for status filter
  const matchStage = {};
  
  // Only show published posts to non-admin users
  if (!req.user || req.user.role !== "admin") {
    matchStage.status = "published";
  } else if (status) {
    matchStage.status = status;
  }
  
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }
  
  // Lookup author for searching by poster name
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "author",
      foreignField: "_id",
      as: "author",
    },
  });
  
  pipeline.push({ $unwind: { path: "$author", preserveNullAndEmptyArrays: true } });
  
  // Search filter (case-insensitive search on title, excerpt, content, author name, and author email)
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { excerpt: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
          { "author.name": { $regex: search, $options: "i" } },
          { "author.email": { $regex: search, $options: "i" } },
        ],
      },
    });
  }
  
  // Get total count before pagination
  const countPipeline = [...pipeline, { $count: "total" }];
  
  // Add sorting and pagination
  pipeline.push({ $sort: { publishedAt: -1, createdAt: -1 } });
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: Number(limit) });
  
  // Project only needed author fields
  pipeline.push({
    $project: {
      title: 1,
      slug: 1,
      excerpt: 1,
      content: 1,
      coverImage: 1,
      status: 1,
      publishedAt: 1,
      readingTimeMinutes: 1,
      createdAt: 1,
      updatedAt: 1,
      "author._id": 1,
      "author.name": 1,
    },
  });
  
  const [blogs, countResult] = await Promise.all([
    Blog.aggregate(pipeline),
    Blog.aggregate(countPipeline),
  ]);
  
  const total = countResult[0]?.total || 0;

  return res.status(200).json({
    blogs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

export const getBlogBySlug = async (req, res) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug }).populate("author", "name").lean();

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  // Only show draft posts to admin
  if (blog.status === "draft" && (!req.user || req.user.role !== "admin")) {
    return res.status(404).json({ message: "Blog not found" });
  }

  return res.status(200).json({ blog });
};

export const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, excerpt, content, coverImage, status } = req.body;

  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (blog.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (title) blog.title = title;
  if (excerpt) blog.excerpt = excerpt;
  if (content) blog.content = content;
  if (coverImage !== undefined) blog.coverImage = coverImage;
  if (status) blog.status = status;

  await blog.save();

  return res.status(200).json({
    message: "Blog updated successfully",
    blog,
  });
};

export const deleteBlog = async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (blog.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  await Blog.findByIdAndDelete(id);

  return res.status(200).json({ message: "Blog deleted successfully" });
};

// Get current user's blogs (including drafts)
export const getMyBlogs = async (req, res) => {
  const blogs = await Blog.find({ author: req.user._id })
    .sort({ createdAt: -1 })
    .populate("author", "name")
    .lean();

  return res.status(200).json({ blogs });
};

// Batch publish: publish a single blog by ID (called concurrently from frontend)
export const publishBlog = async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);
  if (!blog) {
    return res.status(404).json({ message: "Blog not found" });
  }

  if (blog.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  blog.status = "published";
  blog.publishedAt = new Date();
  await blog.save();

  return res.status(200).json({
    message: "Blog published successfully",
    blog,
  });
};
