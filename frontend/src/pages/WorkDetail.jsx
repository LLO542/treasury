import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Media */}
      <div className="card overflow-hidden">
        {work.type === "image" && (
          <img
            src={work.mediaUrl}
            alt={work.title}
            className="w-full max-h-[70vh] object-contain bg-gray-100 dark:bg-gray-800"
          />
        )}
        {work.type === "video" && (
          <video
            src={work.mediaUrl}
            controls
            className="w-full max-h-[70vh]"
          />
        )}
      </div>

      {/* Details */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <h1 className="text-3xl font-bold">{work.title}</h1>
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

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full">
            {work.type}
          </span>
          <span>By {work.owner?.name || "Unknown"}</span>
          <span>{new Date(work.createdAt).toLocaleDateString()}</span>
        </div>

        {work.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {work.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {work.description}
        </p>
      </div>
    </div>
  );
}
