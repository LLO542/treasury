import { useCallback, useState } from "react";
import api from "./axios";

const MAX_PARALLEL = 2;

export function useUploadQueue() {
  const [jobs, setJobs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const addFiles = useCallback((files, endpoint = "/works") => {
    const newJobs = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      endpoint,
      status: "pending",
      progress: 0,
      error: null,
    }));

    setJobs((prev) => [...prev, ...newJobs]);
    return newJobs.map((j) => j.id);
  }, []);

  const uploadFile = useCallback(
    async (job, formDataFields = {}) => {
      const formData = new FormData();
      formData.append("media", job.file);

      Object.entries(formDataFields).forEach(([key, value]) => {
        formData.append(key, typeof value === "object" ? JSON.stringify(value) : value);
      });

      try {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id ? { ...j, status: "uploading", progress: 0 } : j
          )
        );

        const response = await api.post(job.endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setJobs((prev) =>
              prev.map((j) => (j.id === job.id ? { ...j, progress } : j))
            );
          },
        });

        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? { ...j, status: "completed", progress: 100, response: response.data }
              : j
          )
        );

        return response.data;
      } catch (error) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  status: "error",
                  error: error.response?.data?.message || error.message,
                }
              : j
          )
        );
        throw error;
      }
    },
    []
  );

  const processQueue = useCallback(
    async (formDataFields = {}) => {
      setIsUploading(true);

      const pendingJobs = jobs.filter((j) => j.status === "pending");
      const batches = [];

      for (let i = 0; i < pendingJobs.length; i += MAX_PARALLEL) {
        batches.push(pendingJobs.slice(i, i + MAX_PARALLEL));
      }

      for (const batch of batches) {
        await Promise.allSettled(
          batch.map((job) => uploadFile(job, formDataFields))
        );
      }

      setIsUploading(false);
    },
    [jobs, uploadFile]
  );

  const removeJob = useCallback((jobId) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const clearCompleted = useCallback(() => {
    setJobs((prev) => prev.filter((j) => j.status !== "completed"));
  }, []);

  const reset = useCallback(() => {
    setJobs([]);
    setIsUploading(false);
  }, []);

  return {
    jobs,
    isUploading,
    addFiles,
    processQueue,
    removeJob,
    clearCompleted,
    reset,
  };
}

// Upload progress bar component
export function UploadProgress({ jobs }) {
  if (jobs.length === 0) return null;

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div key={job.id} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium truncate max-w-[200px]">
              {job.file.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {job.status === "completed" && "✓ Done"}
              {job.status === "error" && "✗ Failed"}
              {job.status === "uploading" && `${job.progress}%`}
              {job.status === "pending" && "Waiting..."}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                job.status === "error"
                  ? "bg-red-500"
                  : job.status === "completed"
                  ? "bg-green-500"
                  : "bg-primary-500"
              }`}
              style={{ width: `${job.progress}%` }}
            />
          </div>
          {job.error && (
            <p className="text-xs text-red-500 mt-1">{job.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}
