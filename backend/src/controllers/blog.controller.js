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

  const filter = {};

  // Only show published posts to non-admin users
  if (!req.user || req.user.role !== "admin") {
    filter.status = "published";
  } else if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("author", "name")
      .lean(),
    Blog.countDocuments(filter),
  ]);

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
