import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";

const MAX_CONCURRENT = 2; // C1: Only 2 tasks can run at a time

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("blogs");
  const [blogs, setBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [publishTasks, setPublishTasks] = useState({});
  const [isPublishing, setIsPublishing] = useState(false);
  const tasksRef = useRef({});

  // Keep ref in sync
  useEffect(() => {
    tasksRef.current = publishTasks;
  }, [publishTasks]);

  // Fetch user's blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await api.get("/blogs/me");
        setBlogs(response.data.blogs);
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // Toggle selection of a draft blog
  const toggleSelect = (blogId) => {
    // C2: Copy State using spread operator
    setSelectedIds((prev) =>
      prev.includes(blogId)
        ? prev.filter((id) => id !== blogId)
        : [...prev, blogId]
    );
  };

  // Select all drafts
  const selectAllDrafts = () => {
    const draftIds = blogs
      .filter((b) => b.status === "draft")
      .map((b) => b._id);
    setSelectedIds((prev) => {
      const allSelected = draftIds.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !draftIds.includes(id));
      return [...new Set([...prev, ...draftIds])];
    });
  };

  // Publish a single blog with progress simulation
  const publishSingle = async (blogId) => {
    // C2: Update only this task, preserve others using spread
    setPublishTasks((prev) => ({
      ...prev,
      [blogId]: { status: "running", progress: 0 },
    }));

    const duration = 2000 + Math.random() * 3000; // 2-5 seconds
    const startTime = Date.now();

    // Animate progress
    let animId;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(Math.round((elapsed / duration) * 100), 99);
      setPublishTasks((prev) => ({
        ...prev,
        [blogId]: { ...prev[blogId], progress },
      }));
      if (elapsed < duration) animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    await new Promise((r) => setTimeout(r, duration));
    cancelAnimationFrame(animId);

    try {
      await api.patch(`/blogs/${blogId}/publish`);

      // C2: Mark completed with spread
      setPublishTasks((prev) => ({
        ...prev,
        [blogId]: { status: "completed", progress: 100 },
      }));

      // Update blog status in list (C2: spread to preserve)
      setBlogs((prev) =>
        prev.map((b) =>
          b._id === blogId
            ? { ...b, status: "published", publishedAt: new Date().toISOString() }
            : b
        )
      );
    } catch (error) {
      setPublishTasks((prev) => ({
        ...prev,
        [blogId]: {
          status: "error",
          progress: 0,
          error: error.response?.data?.message || error.message,
        },
      }));
    }
  };

  // C1: Process queue with concurrency limit of 2
  const startPublishing = async () => {
    if (selectedIds.length === 0) return;
    setIsPublishing(true);

    // Initialize all tasks as pending
    const initial = {};
    selectedIds.forEach((id) => {
      initial[id] = { status: "pending", progress: 0 };
    });
    setPublishTasks(initial);
    tasksRef.current = initial;

    const queue = [...selectedIds];
    let running = 0;
    let index = 0;

    await new Promise((resolveAll) => {
      const tryNext = () => {
        // Check if all done
        if (index >= queue.length && running === 0) {
          resolveAll();
          return;
        }

        // C1: Start tasks up to MAX_CONCURRENT
        while (running < MAX_CONCURRENT && index < queue.length) {
          const blogId = queue[index++];
          running++;
          publishSingle(blogId).then(() => {
            running--;
            tryNext(); // C1: Auto-start next when one completes
          });
        }
      };

      tryNext();
    });

    setIsPublishing(false);
    setSelectedIds([]);
  };

  const draftBlogs = blogs.filter((b) => b.status === "draft");
  const publishedBlogs = blogs.filter((b) => b.status === "published");

  // Sidebar menu items
  const menuItems = [
    { key: "blogs", label: "My Blogs", icon: "📝", count: blogs.length },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      {/* Left Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        {/* User Card */}
        <div className="card p-6 mb-4 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-3xl font-bold mb-3">
            {(user?.name || "U").charAt(0).toUpperCase()}
          </div>
          <h2 className="text-lg font-semibold">{user?.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
            {user?.role}
          </span>
        </div>

        {/* Menu */}
        <nav className="card p-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                activeTab === item.key
                  ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {item.count}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {activeTab === "blogs" && (
          <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold">My Blog Posts</h1>
              <Link to="/blogs/new" className="btn btn-primary text-sm">
                + New Blog Post
              </Link>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="card p-12 text-center text-gray-500">
                <p className="text-lg mb-4">No blog posts yet</p>
                <Link to="/blogs/new" className="btn btn-primary">
                  Write Your First Post
                </Link>
              </div>
            ) : (
              <>
                {/* Draft Section */}
                {draftBlogs.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                        Drafts ({draftBlogs.length})
                      </h2>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={selectAllDrafts}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {draftBlogs.every((b) => selectedIds.includes(b._id))
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                        {selectedIds.length > 0 && (
                          <button
                            onClick={startPublishing}
                            disabled={isPublishing}
                            className="btn btn-primary text-sm"
                          >
                            {isPublishing
                              ? "Publishing..."
                              : `Publish Selected (${selectedIds.length})`}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {draftBlogs.map((blog) => {
                        const task = publishTasks[blog._id];
                        return (
                          <div
                            key={blog._id}
                            className={`card p-4 transition-all ${
                              selectedIds.includes(blog._id)
                                ? "ring-2 ring-primary-500"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <label className="flex items-center mt-1">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(blog._id)}
                                  onChange={() => toggleSelect(blog._id)}
                                  disabled={isPublishing}
                                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                              </label>

                              {/* Blog Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Link
                                    to={`/blogs/${blog.slug}`}
                                    className="font-medium hover:text-primary-600 truncate"
                                  >
                                    {blog.title}
                                  </Link>
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-200 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300">
                                    draft
                                  </span>
                                  {/* Task status badge */}
                                  {task && (
                                    <span
                                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        task.status === "running"
                                          ? "bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                          : task.status === "completed"
                                          ? "bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300"
                                          : task.status === "pending"
                                          ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                          : "bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300"
                                      }`}
                                    >
                                      {task.status}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {blog.excerpt}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Created{" "}
                                  {new Date(blog.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>

                              {/* Progress Bar - C2: Individual progress */}
                              {task && (
                                <div className="w-32 shrink-0">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>{task.progress}%</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-150 ${
                                        task.status === "completed"
                                          ? "bg-green-500"
                                          : task.status === "error"
                                          ? "bg-red-500"
                                          : "bg-blue-500"
                                      }`}
                                      style={{ width: `${task.progress}%` }}
                                    />
                                  </div>
                                  {task.error && (
                                    <p className="text-xs text-red-500 mt-1">{task.error}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Published Section */}
                {publishedBlogs.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">
                      Published ({publishedBlogs.length})
                    </h2>
                    <div className="space-y-3">
                      {publishedBlogs.map((blog) => (
                        <div key={blog._id} className="card p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Link
                                  to={`/blogs/${blog.slug}`}
                                  className="font-medium hover:text-primary-600 truncate"
                                >
                                  {blog.title}
                                </Link>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300">
                                  published
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {blog.excerpt}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                Published{" "}
                                {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
