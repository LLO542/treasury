import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";

export default function CreateBlog() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post("/blogs", {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage || null,
        status: data.status,
      });

      navigate("/blogs");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create blog post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Write New Blog Post</h1>

      <div className="card p-6">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              className={`input ${errors.title ? "border-red-500" : ""}`}
              {...register("title", {
                required: "Title is required",
                maxLength: {
                  value: 160,
                  message: "Title must be at most 160 characters",
                },
              })}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slug *</label>
            <input
              type="text"
              className={`input ${errors.slug ? "border-red-500" : ""}`}
              placeholder="my-blog-post"
              {...register("slug", {
                required: "Slug is required",
                pattern: {
                  value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                  message:
                    "Slug must be lowercase letters, numbers, and hyphens only",
                },
              })}
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cover Image URL</label>
            <input
              type="url"
              className="input"
              placeholder="https://example.com/image.jpg"
              {...register("coverImage")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Excerpt *</label>
            <textarea
              rows={2}
              className={`input ${errors.excerpt ? "border-red-500" : ""}`}
              placeholder="A brief summary of your blog post..."
              {...register("excerpt", {
                required: "Excerpt is required",
                minLength: {
                  value: 40,
                  message: "Excerpt must be at least 40 characters",
                },
                maxLength: {
                  value: 280,
                  message: "Excerpt must be at most 280 characters",
                },
              })}
            />
            {errors.excerpt && (
              <p className="text-red-500 text-sm mt-1">{errors.excerpt.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Content *</label>
            <textarea
              rows={12}
              className={`input font-mono ${errors.content ? "border-red-500" : ""}`}
              placeholder="Write your blog post content here..."
              {...register("content", {
                required: "Content is required",
                minLength: {
                  value: 120,
                  message: "Content must be at least 120 characters",
                },
              })}
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select className="input" {...register("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-1"
            >
              {isSubmitting ? "Publishing..." : "Publish Post"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
