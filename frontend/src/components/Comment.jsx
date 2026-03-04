import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";

/**
 * Recursive Comment Component (C1 Requirement)
 * - Renders nested replies up to 6 levels deep
 * - Shows indentation based on depth
 * - Calls itself recursively for replies
 */
export default function Comment({ comment, depth = 0, onReply, onDelete, maxDepth = 6 }) {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canReply = isAuthenticated && depth < maxDepth;
  const canDelete = isAuthenticated && (
    user?._id === comment.author?._id || 
    user?.id === comment.author?._id ||
    isAdmin
  );

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(comment._id, replyContent);
      setReplyContent("");
      setIsReplying(false);
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this comment and all its replies?")) return;
    await onDelete(comment._id);
  };

  // Calculate indentation - deeper = more margin (C1: UI shows indentation based on depth)
  const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : "";
  const borderClass = depth > 0 ? "border-l-2 border-gray-200 dark:border-gray-700 pl-4" : "";

  return (
    <div className={`${indentClass} ${borderClass} ${depth > 0 ? "mt-3" : ""}`}>
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
              {(comment.author?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {comment.author?.name || "Unknown"}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {new Date(comment.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {depth > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                  (Level {depth})
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {canReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Reply
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Comment Content */}
        <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* Reply Form */}
        {isReplying && (
          <form onSubmit={handleSubmitReply} className="mt-3 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${comment.author?.name || "this comment"}...`}
              className="input text-sm min-h-[80px] resize-none"
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !replyContent.trim()}
                className="btn btn-primary text-xs py-1 px-3"
              >
                {isSubmitting ? "Posting..." : "Post Reply"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent("");
                }}
                className="btn btn-secondary text-xs py-1 px-3"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recursive Rendering of Replies (C1: Component calls itself) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <Comment
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onDelete={onDelete}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Comment Section Component
 * Manages state with proper deep update pattern (C2 Requirement)
 */
export function CommentSection({ blogId }) {
  const { isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch comments on mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await api.get(`/comments/blog/${blogId}`);
        setComments(response.data.comments);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load comments");
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [blogId]);

  /**
   * Deep Update Function (C2 Requirement)
   * Uses recursive immutable updates - NO mutation like comments.push()
   * Returns new object: { ...c, replies: [...] }
   */
  const updateCommentsDeep = (comments, parentId, newReply) => {
    return comments.map((comment) => {
      if (comment._id === parentId) {
        // Found the parent - return NEW object with updated replies (not mutation!)
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      }
      // Recursively search in replies
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentsDeep(comment.replies, parentId, newReply),
        };
      }
      return comment;
    });
  };

  /**
   * Deep Delete Function
   * Uses recursive immutable updates
   */
  const deleteCommentDeep = (comments, commentId) => {
    return comments
      .filter((comment) => comment._id !== commentId)
      .map((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: deleteCommentDeep(comment.replies, commentId),
          };
        }
        return comment;
      });
  };

  // Submit new root comment
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/comments/blog/${blogId}`, {
        content: newComment,
      });
      // Add to state immutably (C2: no mutation)
      setComments((prev) => [...prev, response.data.comment]);
      setNewComment("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reply to a comment (C2: Deep Insertion)
  const handleReply = async (parentCommentId, content) => {
    const response = await api.post(`/comments/blog/${blogId}`, {
      content,
      parentCommentId,
    });

    // Deep update using immutable pattern (C2 Requirement)
    setComments((prev) => updateCommentsDeep(prev, parentCommentId, response.data.comment));
  };

  // Handle delete
  const handleDelete = async (commentId) => {
    await api.delete(`/comments/${commentId}`);
    
    // Deep delete using immutable pattern
    setComments((prev) => deleteCommentDeep(prev, commentId));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">
        Comments ({comments.length})
      </h2>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* New Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="input min-h-[100px] resize-none"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="btn btn-primary"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center text-gray-600 dark:text-gray-400">
          <a href="/login" className="text-primary-600 hover:underline">
            Login
          </a>{" "}
          to leave a comment
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              depth={0}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
