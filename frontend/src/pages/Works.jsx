import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";
import { fetchWithCache } from "../lib/cache";

export default function Works() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [works, setWorks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const { isAdmin } = useAuth();

  const type = searchParams.get("type") || "";
  const tags = searchParams.get("tags") || "";
  const search = searchParams.get("search") || "";
  const page = searchParams.get("page") || "1";

  useEffect(() => {
    const fetchWorks = async () => {
      setIsLoading(true);
      setError(null);

      const cacheKey = `works_${type}_${tags}_${search}_${page}`;

      try {
        const { data, fromCache: cached } = await fetchWithCache(cacheKey, async () => {
          const params = new URLSearchParams();
          if (type) params.set("type", type);
          if (tags) params.set("tags", tags);
          if (search) params.set("search", search);
          params.set("page", page);

          const response = await api.get(`/works?${params}`);
          return response.data;
        });

        setWorks(data.works);
        setPagination(data.pagination);
        setFromCache(cached);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load works");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorks();
  }, [type, tags, search, page]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1"); // Reset to first page on filter change
    setSearchParams(newParams);
  };

  const typeOptions = ["", "image", "video", "text"];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Works</h1>
        {isAdmin && (
          <Link to="/dashboard/works/new" className="btn btn-primary">
            + Add New Work
          </Link>
        )}
      </div>

      {fromCache && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg text-sm">
          You&apos;re viewing cached data (offline mode)
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search works..."
              className="input"
              value={search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </div>
          <select
            className="input md:w-48"
            value={type}
            onChange={(e) => updateFilter("type", e.target.value)}
          >
            <option value="">All Types</option>
            {typeOptions.slice(1).map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Tags (comma-separated)"
            className="input md:w-48"
            value={tags}
            onChange={(e) => updateFilter("tags", e.target.value)}
          />
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Works Grid */}
      {!isLoading && !error && (
        <>
          {works.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No works found. Try adjusting your filters.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((work) => (
                <Link key={work._id} to={`/works/${work.slug}`} className="card group">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                    {work.type === "image" && (
                      <img
                        src={work.mediaUrl}
                        alt={work.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    {work.type === "video" && (
                      <video
                        src={work.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                    {work.type === "text" && (
                      <div className="flex items-center justify-center h-full text-4xl">
                        📝
                      </div>
                    )}
                    <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {work.type}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {work.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {work.description}
                    </p>
                    {work.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {work.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateFilter("page", p.toString())}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    p === pagination.page
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
