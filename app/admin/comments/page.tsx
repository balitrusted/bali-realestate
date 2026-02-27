"use client";

import { useState, useEffect } from "react";
import { Comment } from "@/types/article";

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  useEffect(() => {
    fetchAllComments();
  }, []);

  const fetchAllComments = async () => {
    try {
      const response = await fetch("/api/comments/admin");
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch("/api/comments/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, approved: true }),
      });

      if (response.ok) {
        fetchAllComments();
      }
    } catch (error) {
      console.error("Error approving comment:", error);
      alert("Failed to approve comment");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/admin?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchAllComments();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const filteredComments = comments.filter(comment => {
    if (filter === "pending") return !comment.approved;
    if (filter === "approved") return comment.approved;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Comments Moderation</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md ${
              filter === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            All ({comments.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-md ${
              filter === "pending" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Pending ({comments.filter(c => !c.approved).length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-md ${
              filter === "approved" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Approved ({comments.filter(c => c.approved).length})
          </button>
        </div>
      </div>

      {filteredComments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No comments found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`border rounded-lg p-4 ${
                comment.approved ? "border-gray-200" : "border-yellow-300 bg-yellow-50"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">
                      {comment.authorName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {comment.authorEmail}
                    </span>
                    {comment.authorWebsite && (
                      <a
                        href={comment.authorWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {comment.authorWebsite}
                      </a>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    {!comment.approved && (
                      <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                        Pending
                      </span>
                    )}
                  </div>
                  <div 
                    className="text-gray-700 mb-2"
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                  />
                  <p className="text-xs text-gray-500">
                    Article ID: {comment.articleId}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!comment.approved && (
                    <button
                      onClick={() => handleApprove(comment.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
