import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";
import { CommentSection } from "../components/Comment";

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
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <Link to="/blogs" className="btn btn-primary">
          ← Back to Blogs
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back Navigation */}
      <nav className="mb-6">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Blogs
        </Link>
      </nav>

      {/* Cover Image */}
      {blog.coverImage && (
        <div className="relative w-full aspect-video sm:aspect-[2/1] lg:aspect-[3/1] mb-8 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <header className="mb-8">
        {/* Status Badge */}
        {blog.status === "draft" && (
          <span className="inline-block bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium mb-4">
            Draft
          </span>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 break-words hyphens-auto leading-tight">
          {blog.title}
        </h1>

        {/* Author & Meta Info */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
              {(blog.author?.name || "U").charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {blog.author?.name || "Unknown Author"}
            </span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span>
            {blog.publishedAt
              ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Not published"}
          </span>
          {blog.readingTimeMinutes > 0 && (
            <>
              <span className="hidden sm:inline">•</span>
              <span>{blog.readingTimeMinutes} min read</span>
            </>
          )}
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn-danger text-sm"
            >
              {isDeleting ? "Deleting..." : "Delete Post"}
            </button>
          </div>
        )}
      </header>

      {/* Excerpt */}
      {blog.excerpt && (
        <blockquote className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 border-l-4 border-primary-500 pl-4 sm:pl-6 italic break-words">
          {blog.excerpt}
        </blockquote>
      )}

      {/* Content */}
      <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none break-words">
        {blog.content.split("\n").map((paragraph, index) =>
          paragraph.trim() ? (
            <p key={index} className="mb-4 break-words">
              {paragraph}
            </p>
          ) : (
            <br key={index} />
          )
        )}
      </div>

      {/* Comment Section (C1: Recursive Component with nested replies) */}
      <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <CommentSection blogId={blog._id} />
      </section>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated:{" "}
            {new Date(blog.updatedAt || blog.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
          <Link
            to="/blogs"
            className="btn btn-secondary text-sm"
          >
            ← Back to All Posts
          </Link>
        </div>
      </footer>
    </article>
  );
}
