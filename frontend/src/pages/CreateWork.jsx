import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { UploadProgress, useUploadQueue } from "../lib/uploadQueue";

export default function CreateWork() {
  const navigate = useNavigate();
  const { jobs, addFiles, processQueue, reset } = useUploadQueue();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files?.length > 0) {
      setSelectedFile(files[0]);
      addFiles(files, "/works");
    }
  };

  const onSubmit = async (data) => {
    if (!selectedFile) {
      setError("Please select a media file");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await processQueue({
        title: data.title,
        slug: data.slug,
        description: data.description,
        type: data.type,
        tags: data.tags,
      });

      const completedJob = jobs.find((j) => j.status === "completed");
      if (completedJob) {
        navigate("/works");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create work");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Upload New Work</h1>

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
                  value: 140,
                  message: "Title must be at most 140 characters",
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
              placeholder="my-work-title"
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
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select
              className={`input ${errors.type ? "border-red-500" : ""}`}
              {...register("type", { required: "Type is required" })}
            >
              <option value="">Select type</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="text">Text</option>
            </select>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              rows={4}
              className={`input ${errors.description ? "border-red-500" : ""}`}
              {...register("description", {
                required: "Description is required",
                minLength: {
                  value: 40,
                  message: "Description must be at least 40 characters",
                },
                maxLength: {
                  value: 2000,
                  message: "Description must be at most 2000 characters",
                },
              })}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              className="input"
              placeholder="art, design, photography"
              {...register("tags")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Media File *</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-primary-100 file:text-primary-700
                dark:file:bg-primary-900 dark:file:text-primary-300
                hover:file:bg-primary-200 dark:hover:file:bg-primary-800
                cursor-pointer"
            />
            {selectedFile && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {jobs.length > 0 && (
            <div className="mt-4">
              <UploadProgress jobs={jobs} />
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex-1"
            >
              {isSubmitting ? "Uploading..." : "Upload Work"}
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                navigate("/dashboard");
              }}
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
