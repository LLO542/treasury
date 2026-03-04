import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";
import { fetchWithCache } from "../lib/cache";

export default function Blogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const { isAdmin } = useAuth();

  const search = searchParams.get("search") || "";
  const page = searchParams.get("page") || "1";

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      setError(null);

      const cacheKey = `blogs_${search}_${page}`;

      try {
        const { data, fromCache: cached } = await fetchWithCache(cacheKey, async () => {
          const params = new URLSearchParams();
          if (search) params.set("search", search);
          params.set("page", page);

          const response = await api.get(`/blogs?${params}`);
          return response.data;
        });

        setBlogs(data.blogs);
        setPagination(data.pagination);
        setFromCache(cached);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load blogs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [search, page]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Blog</h1>
        {isAdmin && (
          <Link to="/dashboard/blogs/new" className="btn btn-primary">
            + Write New Post
          </Link>
        )}
      </div>

      {fromCache && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg text-sm">
          You&apos;re viewing cached data (offline mode)
        </div>
      )}

      {/* Search */}
      <div className="card p-4">
        <input
          type="text"
          placeholder="Search posts..."
          className="input"
          value={search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
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

      {/* Blog Posts */}
      {!isLoading && !error && (
        <>
          {blogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No blog posts found.
            </div>
          ) : (
            <div className="space-y-6">
              {blogs.map((blog) => (
                <Link key={blog._id} to={`/blogs/${blog.slug}`} className="card block group">
                  <div className="md:flex">
                    {blog.coverImage && (
                      <div className="md:w-64 h-48 md:h-auto flex-shrink-0">
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1">
                      <h2 className="text-xl font-semibold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {blog.title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {blog.excerpt}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{blog.author?.name || "Unknown"}</span>
                        <span>•</span>
                        <span>
                          {blog.publishedAt
                            ? new Date(blog.publishedAt).toLocaleDateString()
                            : "Draft"}
                        </span>
                        <span>•</span>
                        <span>{blog.readingTimeMinutes} min read</span>
                      </div>
                    </div>
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
