import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import workRoutes from "./routes/work.routes.js";

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/works", workRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/media", mediaRoutes);

// Multer error handling
app.use((err, _req, res, next) => {
  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong" });
});

export default app;
