"use client";

import { useState, useEffect } from "react";
import { Comment } from "@/types/article";
import { formatLocaleDate } from "@/lib/formatDate";

const MIN_SUBMITTING_MS = 900;
const SUCCESS_BANNER_MS = 5000;

interface ArticleCommentsProps {
  articleId: string;
}

interface CommentWithReplies extends Comment {
  replies?: CommentWithReplies[];
}

export default function ArticleComments({ articleId }: ArticleCommentsProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    authorName: "",
    authorEmail: "",
    content: "",
    parentId: null as string | null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [voting, setVoting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?articleId=${articleId}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const startedAt = Date.now();

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorName: formData.authorName,
          authorEmail: formData.authorEmail,
          content: formData.content,
          articleId,
          parentId: formData.parentId || undefined,
        }),
      });

      if (response.ok) {
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_SUBMITTING_MS) {
          await new Promise((resolve) => setTimeout(resolve, MIN_SUBMITTING_MS - elapsed));
        }
        setSubmitted(true);
        setFormData({
          authorName: "",
          authorEmail: "",
          content: "",
          parentId: null,
        });
        setReplyingTo(null);
        document.getElementById("comment-success")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
        setTimeout(() => {
          fetchComments();
          setSubmitted(false);
        }, SUCCESS_BANNER_MS);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (commentId: string, voteType: 'up' | 'down') => {
    if (voting[commentId]) return;
    
    setVoting({ ...voting, [commentId]: true });

    try {
      const response = await fetch("/api/comments/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId,
          voteType,
        }),
      });

      if (response.ok) {
        // Refresh comments to get updated vote counts
        fetchComments();
      } else {
        const error = await response.json();
        console.error("Error voting:", error);
      }
    } catch (error) {
      console.error("Error voting on comment:", error);
    } finally {
      setVoting({ ...voting, [commentId]: false });
    }
  };

  const startReply = (commentId: string, authorName: string) => {
    setReplyingTo(commentId);
    setFormData({
      ...formData,
      parentId: commentId,
      content: `@${authorName} `,
    });
    // Scroll to form
    setTimeout(() => {
      document.getElementById('comment-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setFormData({
      ...formData,
      parentId: null,
      content: "",
    });
  };

  const getTotalComments = (comments: CommentWithReplies[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? getTotalComments(comment.replies) : 0);
    }, 0);
  };

  const CommentItem = ({ comment, depth = 0 }: { comment: CommentWithReplies; depth?: number }) => {
    const upvotes = comment.upvotes || 0;
    const downvotes = comment.downvotes || 0;
    const score = upvotes - downvotes;

    return (
      <div className={`${depth > 0 ? 'ml-8 mt-4 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="flex gap-4">
          {/* Vote buttons */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <button
              onClick={() => handleVote(comment.id, 'up')}
              disabled={voting[comment.id]}
              className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                voting[comment.id] ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Upvote"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className={`text-sm font-semibold ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {score}
            </span>
            <button
              onClick={() => handleVote(comment.id, 'down')}
              disabled={voting[comment.id]}
              className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                voting[comment.id] ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Downvote"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Comment content */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-gray-600 font-semibold text-sm">
                  {comment.authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-semibold text-gray-900">
                    {comment.authorName}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatLocaleDate(comment.createdAt)}
                  </span>
                </div>
                <div 
                  className="text-gray-700 prose prose-sm max-w-none mb-3"
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
                
                {/* Reply button */}
                <button
                  onClick={() => startReply(comment.id, comment.authorName)}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Reply
                </button>
              </div>
            </div>

            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-gray-600">Loading comments...</div>;
  }

  const totalComments = getTotalComments(comments);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Comments ({totalComments})
      </h2>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-gray-600">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}

      {/* Comment Form */}
      <div id="comment-form" className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {replyingTo ? (
            <span>
              Reply to comment
              <button
                onClick={cancelReply}
                className="ml-2 text-sm text-gray-600 hover:text-gray-900 underline"
              >
                (Cancel)
              </button>
            </span>
          ) : (
            "Leave a Comment"
          )}
        </h3>
        
        {submitted && (
          <div
            id="comment-success"
            className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-4 shadow-sm"
            role="status"
            aria-live="polite"
          >
            <p className="font-medium text-green-900">
              Thank you. Your comment was sent successfully.
            </p>
            <p className="mt-1 text-sm text-green-800">
              It is now awaiting moderation and will appear after approval.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email * (will not be published)
              </label>
              <input
                type="email"
                required
                value={formData.authorEmail}
                onChange={(e) => setFormData({ ...formData, authorEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Comment *
            </label>
            <textarea
              required
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              placeholder={replyingTo ? "Your reply..." : "Your comment..."}
            />
            <p className="mt-2 text-sm text-gray-600">
              You can use basic HTML tags: &lt;strong&gt;, &lt;em&gt;, &lt;a&gt;, &lt;code&gt;
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : submitted ? "Sent" : replyingTo ? "Submit Reply" : "Submit Comment"}
          </button>
        </form>
      </div>
    </div>
  );
}
