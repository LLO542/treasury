import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import api from "../lib/axios";

export default function Dashboard() {
  const { isDarkMode, toggleTheme, primaryColor, setPrimaryColor, colorPresets } = useTheme();
  const [stats, setStats] = useState({ works: 0, blogs: 0 });
  const [recentWorks, setRecentWorks] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [worksRes, blogsRes] = await Promise.all([
          api.get("/works?limit=5"),
          api.get("/blogs?limit=5"),
        ]);

        setStats({
          works: worksRes.data.pagination.total,
          blogs: blogsRes.data.pagination.total,
        });
        setRecentWorks(worksRes.data.works);
        setRecentBlogs(blogsRes.data.blogs);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Color preview classes for each preset
  const colorClasses = {
    blue: "bg-blue-500",
    red: "bg-red-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500",
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Theme Settings - C2: Both Dark Mode toggle AND Color Picker on same page */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Theme Settings</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Dark Mode Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Dark Mode
            </span>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isDarkMode ? "bg-primary-600" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={isDarkMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-gray-300 dark:bg-gray-600" />

          {/* Color Picker */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Primary Color
            </span>
            <div className="flex items-center gap-2">
              {Object.entries(colorPresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => setPrimaryColor(key)}
                  className={`w-8 h-8 rounded-full ${colorClasses[key]} transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 ${
                    primaryColor === key
                      ? "ring-2 ring-offset-2 ring-gray-800 dark:ring-white scale-110"
                      : ""
                  }`}
                  title={preset.name}
                  aria-label={`Set ${preset.name} as primary color`}
                />
              ))}
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Your theme preferences are saved automatically and persist across sessions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
            Total Works
          </h3>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {stats.works}
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
            Total Blog Posts
          </h3>
          <p className="text-4xl font-bold text-primary-600 dark:text-primary-400">
            {stats.blogs}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/dashboard/works/new" className="btn btn-primary">
            + Upload Work
          </Link>
          <Link to="/dashboard/blogs/new" className="btn btn-primary">
            + Write Blog Post
          </Link>
        </div>
      </div>

      {/* Recent Content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Works */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Works</h2>
          {recentWorks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No works yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentWorks.map((work) => (
                <li key={work._id}>
                  <Link
                    to={`/works/${work.slug}`}
                    className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">
                      {work.type === "image" ? "🖼️" : work.type === "video" ? "🎬" : "📝"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{work.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(work.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Blogs */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Blog Posts</h2>
          {recentBlogs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No blog posts yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentBlogs.map((blog) => (
                <li key={blog._id}>
                  <Link
                    to={`/blogs/${blog.slug}`}
                    className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                  >
                    <span className="text-2xl">📄</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{blog.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {blog.status === "published" ? "Published" : "Draft"} •{" "}
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
