import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [blog, setBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await api.get(`/blogs/${slug}`);
        setBlog(response.data.blog);
      } catch (err) {
        setError(err.response?.data?.message || "Blog not found");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    setIsDeleting(true);
    try {
      await api.delete(`/blogs/${blog._id}`);
      navigate("/blogs");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      {/* Cover Image */}
      {blog.coverImage && (
        <img
          src={blog.coverImage}
          alt={blog.title}
          className="w-full h-64 md:h-96 object-cover rounded-xl mb-8"
        />
      )}

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-4xl font-bold">{blog.title}</h1>
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn-danger"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
          <span>{blog.author?.name || "Unknown"}</span>
          <span>•</span>
          <span>
            {blog.publishedAt
              ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Draft"}
          </span>
          <span>•</span>
          <span>{blog.readingTimeMinutes} min read</span>
        </div>
      </header>

      {/* Excerpt */}
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 border-l-4 border-primary-500 pl-4 italic">
        {blog.excerpt}
      </p>

      {/* Content */}
      <div className="prose dark:prose-invert max-w-none">
        {blog.content.split("\n").map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
