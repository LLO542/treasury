import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";

export default function WorkDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [work, setWork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchWork = async () => {
      try {
        const response = await api.get(`/works/${slug}`);
        setWork(response.data.work);
      } catch (err) {
        setError(err.response?.data?.message || "Work not found");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWork();
  }, [slug]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this work?")) return;

    setIsDeleting(true);
    try {
      await api.delete(`/works/${work._id}`);
      navigate("/works");
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
        <Link to="/works" className="btn btn-primary">
          ← Back to Works
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Back Navigation */}
      <nav>
        <Link
          to="/works"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Works
        </Link>
      </nav>

      {/* Media */}
      <div className="card overflow-hidden bg-gray-100 dark:bg-gray-800">
        {work.type === "image" && (
          <img
            src={work.mediaUrl}
            alt={work.title}
            className="w-full max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh] object-contain"
          />
        )}
        {work.type === "video" && (
          <video
            src={work.mediaUrl}
            controls
            className="w-full max-h-[50vh] sm:max-h-[60vh] lg:max-h-[70vh]"
            playsInline
          />
        )}
        {work.type === "text" && (
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none break-words">
              {work.description}
            </div>
          </div>
        )}
      </div>

      {/* Details Card */}
      <div className="card p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold break-words hyphens-auto leading-tight flex-1">
            {work.title}
          </h1>
          {isAdmin && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn-danger text-sm shrink-0"
            >
              {isDeleting ? "Deleting..." : "Delete Work"}
            </button>
          )}
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full font-medium capitalize">
            {work.type}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {work.owner?.name || "Unknown"}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(work.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Tags */}
        {work.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {work.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {work.description && work.type !== "text" && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
              {work.description}
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-center pb-4">
        <Link
          to="/works"
          className="btn btn-secondary text-sm"
        >
          ← Back to All Works
        </Link>
      </div>
    </div>
  );
}
