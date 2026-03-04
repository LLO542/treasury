import { useState, useRef, useCallback, useEffect } from "react";
import api from "../lib/axios";

const MAX_CONCURRENT = 2; // C1: Only 2 tasks can run at a time

/**
 * Draft Blog Queue System (C1: Concurrency Control)
 * - Maximum 2 concurrent uploads
 * - Auto-start next task when one completes
 * - Independent progress per task (C2)
 * - State preservation with spread operator (C2)
 */
export default function DraftBlogQueue() {
  const [tasks, setTasks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const runningCountRef = useRef(0);
  const taskIdRef = useRef(0);

  // Count running tasks
  const getRunningCount = useCallback(() => {
    return tasks.filter((t) => t.status === "running").length;
  }, [tasks]);

  // Add sample draft blogs (for testing C1)
  const addSampleDrafts = () => {
    const sampleDrafts = Array.from({ length: 10 }, (_, i) => ({
      id: ++taskIdRef.current,
      title: `Draft Blog ${taskIdRef.current}`,
      slug: `draft-blog-${Date.now()}-${taskIdRef.current}`,
      excerpt: `This is a sample excerpt for draft blog ${taskIdRef.current}. It contains enough characters to pass validation.`,
      content: `This is the content for draft blog ${taskIdRef.current}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      status: "waiting", // waiting → pending → running → completed
      progress: 0,
      error: null,
    }));

    // C2: State preservation using spread operator
    setTasks((prevTasks) => [...prevTasks, ...sampleDrafts]);
  };

  // Process a single task
  const processTask = useCallback(async (taskId) => {
    // Update status to running (C2: spread pattern)
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: "running", progress: 0 } : t
      )
    );

    try {
      // Simulate progress updates (like real upload)
      const duration = 2000 + Math.random() * 3000; // 2-5 seconds (C2: tasks have different speeds)
      const startTime = Date.now();

      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(Math.round((elapsed / duration) * 100), 100);

        // C2: Update only this task's progress, preserve others
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId ? { ...t, progress } : t
          )
        );

        if (progress < 100) {
          requestAnimationFrame(updateProgress);
        }
      };
      requestAnimationFrame(updateProgress);

      // Wait for the simulated duration
      await new Promise((resolve) => setTimeout(resolve, duration));

      // Get task data for API call
      let taskData;
      setTasks((prevTasks) => {
        taskData = prevTasks.find((t) => t.id === taskId);
        return prevTasks;
      });

      // Make actual API call to create draft blog
      await api.post("/blogs", {
        title: taskData.title,
        slug: taskData.slug,
        excerpt: taskData.excerpt,
        content: taskData.content,
        status: "draft",
      });

      // C2: Update to completed (spread pattern)
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? { ...t, status: "completed", progress: 100 }
            : t
        )
      );
    } catch (error) {
      // C2: Update error state (spread pattern)
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "error",
                error: error.response?.data?.message || error.message,
              }
            : t
        )
      );
    }

    runningCountRef.current--;
  }, []);

  // Start processing queue (C1: Concurrency control)
  const startProcessing = useCallback(() => {
    setIsProcessing(true);

    // Mark all waiting tasks as pending
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.status === "waiting" ? { ...t, status: "pending" } : t
      )
    );
  }, []);

  // Effect to manage queue processing (C1: Auto-start next when one completes)
  useEffect(() => {
    if (!isProcessing) return;

    const pendingTasks = tasks.filter((t) => t.status === "pending");
    const runningTasks = tasks.filter((t) => t.status === "running");
    const currentRunning = runningTasks.length;

    // C1: Only allow MAX_CONCURRENT tasks to run
    const slotsAvailable = MAX_CONCURRENT - currentRunning;

    if (slotsAvailable > 0 && pendingTasks.length > 0) {
      // Start next task(s) to fill available slots
      const tasksToStart = pendingTasks.slice(0, slotsAvailable);
      tasksToStart.forEach((task) => {
        runningCountRef.current++;
        processTask(task.id);
      });
    }

    // Check if all done
    const allDone = tasks.every(
      (t) => t.status === "completed" || t.status === "error"
    );
    if (allDone && tasks.length > 0) {
      setIsProcessing(false);
    }
  }, [tasks, isProcessing, processTask]);

  // Clear completed tasks
  const clearCompleted = () => {
    setTasks((prevTasks) =>
      prevTasks.filter((t) => t.status !== "completed" && t.status !== "error")
    );
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "waiting":
        return "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
      case "pending":
        return "bg-yellow-200 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
      case "running":
        return "bg-blue-200 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
      case "completed":
        return "bg-green-200 dark:bg-green-900 text-green-700 dark:text-green-300";
      case "error":
        return "bg-red-200 dark:bg-red-900 text-red-700 dark:text-red-300";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  // Get progress bar color
  const getProgressColor = (status) => {
    switch (status) {
      case "running":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const runningCount = tasks.filter((t) => t.status === "running").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const waitingCount = tasks.filter((t) => t.status === "waiting").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Draft Blog Queue</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Concurrency Control Demo: Max {MAX_CONCURRENT} concurrent tasks
      </p>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={addSampleDrafts}
          disabled={isProcessing}
          className="btn btn-secondary"
        >
          Add 10 Draft Blogs
        </button>
        <button
          onClick={startProcessing}
          disabled={isProcessing || tasks.filter((t) => t.status === "waiting").length === 0}
          className="btn btn-primary"
        >
          Start Processing
        </button>
        <button
          onClick={clearCompleted}
          disabled={completedCount === 0}
          className="btn btn-secondary"
        >
          Clear Completed ({completedCount})
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{runningCount}</div>
          <div className="text-sm text-gray-500">Running</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{waitingCount}</div>
          <div className="text-sm text-gray-500">Waiting</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            <p>No tasks in queue. Click "Add 10 Draft Blogs" to start.</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{task.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{task.slug}</p>
              </div>

              {/* Progress Bar (C2: Individual progress) */}
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${getProgressColor(
                      task.status
                    )}`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>

              {/* Error Message */}
              {task.error && (
                <div className="text-red-500 text-sm">{task.error}</div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 card p-4 bg-blue-50 dark:bg-blue-900/20 text-sm">
        <h3 className="font-semibold mb-2">C1. Concurrency Control Test:</h3>
        <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
          <li>Click "Add 10 Draft Blogs" to add 10 tasks (all in "waiting" status)</li>
          <li>Click "Start Processing" to begin</li>
          <li>
            <strong>First second:</strong> Only 2 tasks will be "running" with progress bars moving
          </li>
          <li>Tasks 3-10 will be "pending" (yellow), waiting in queue</li>
          <li>
            <strong>Auto-start:</strong> When Task 1 reaches 100%, Task 3 starts automatically
          </li>
        </ol>
      </div>
    </div>
  );
}
