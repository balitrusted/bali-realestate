"use client";

import { useState, useEffect } from "react";
import { Comment } from "@/types/article";

type ModerationFilter = "all" | "pending" | "approved" | "rejected";
type ArticleLinkMap = Record<string, string>;

function getCommentStatus(comment: Comment): "pending" | "approved" | "rejected" {
  if (comment.moderationStatus === "approved") return "approved";
  if (comment.moderationStatus === "rejected") return "rejected";
  if (comment.moderationStatus === "pending") return "pending";
  return comment.approved ? "approved" : "pending";
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ModerationFilter>("pending");
  const [selectedRejectedIds, setSelectedRejectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [articleLinkMap, setArticleLinkMap] = useState<ArticleLinkMap>({});

  useEffect(() => {
    fetchAllComments();
    void buildArticleLinkMap();
  }, []);

  const buildArticleLinkMap = async () => {
    try {
      const [articlesRes, blogRes] = await Promise.all([
        fetch("/api/articles?published=false", { cache: "no-store" }),
        fetch("/api/admin/blog", { cache: "no-store" }),
      ]);

      const nextMap: ArticleLinkMap = {};

      if (articlesRes.ok) {
        const articlesData = (await articlesRes.json()) as {
          articles?: Array<{ id: string; category: string; slug: string }>;
        };
        for (const a of articlesData.articles ?? []) {
          if (!a?.id || !a?.category || !a?.slug) continue;
          nextMap[a.id] = `/guides/${a.category}/${a.slug}`;
        }
      }

      if (blogRes.ok) {
        const blogData = (await blogRes.json()) as {
          posts?: Array<{ id: string; slug: string }>;
        };
        for (const p of blogData.posts ?? []) {
          if (!p?.id || !p?.slug) continue;
          nextMap[`blog:${p.id}`] = `/blog/${p.slug}`;
        }
      }

      setArticleLinkMap(nextMap);
    } catch (error) {
      console.error("Error building article link map:", error);
    }
  };

  const getArticleHref = (articleId: string): string | null => {
    if (!articleId) return null;
    if (articleLinkMap[articleId]) return articleLinkMap[articleId];
    if (articleId.startsWith("glossary:")) {
      const termId = articleId.slice("glossary:".length).trim();
      return termId ? `/glossary/${termId}` : null;
    }
    return null;
  };

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
        body: JSON.stringify({ id, moderationStatus: "approved" }),
      });

      if (response.ok) {
        setSelectedRejectedIds((prev) => prev.filter((x) => x !== id));
        fetchAllComments();
      }
    } catch (error) {
      console.error("Error approving comment:", error);
      alert("Failed to approve comment");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch("/api/comments/admin", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, moderationStatus: "rejected" }),
      });

      if (response.ok) {
        setSelectedRejectedIds((prev) => prev.filter((x) => x !== id));
        fetchAllComments();
      }
    } catch (error) {
      console.error("Error rejecting comment:", error);
      alert("Failed to reject comment");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete permanently from Rejected history? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/admin?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSelectedRejectedIds((prev) => prev.filter((x) => x !== id));
        fetchAllComments();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const handleBulkDeleteRejected = async () => {
    if (selectedRejectedIds.length === 0 || bulkDeleting) return;
    if (
      !confirm(
        `Delete ${selectedRejectedIds.length} rejected comment(s) permanently? This cannot be undone.`
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    try {
      const response = await fetch("/api/comments/admin", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedRejectedIds }),
      });
      if (response.ok) {
        setSelectedRejectedIds([]);
        fetchAllComments();
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data?.error || "Failed to delete selected comments");
      }
    } catch (error) {
      console.error("Error deleting selected comments:", error);
      alert("Failed to delete selected comments");
    } finally {
      setBulkDeleting(false);
    }
  };

  const filteredComments = comments.filter(comment => {
    const status = getCommentStatus(comment);
    if (filter === "pending") return status === "pending";
    if (filter === "approved") return status === "approved";
    if (filter === "rejected") return status === "rejected";
    return true;
  });

  const rejectedVisible = filteredComments.filter((c) => getCommentStatus(c) === "rejected");
  const allRejectedVisibleSelected =
    rejectedVisible.length > 0 &&
    rejectedVisible.every((c) => selectedRejectedIds.includes(c.id));

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
            Approved ({comments.filter(c => getCommentStatus(c) === "approved").length})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-md ${
              filter === "rejected" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Rejected ({comments.filter(c => getCommentStatus(c) === "rejected").length})
          </button>
        </div>
      </div>

      {filter === "rejected" && filteredComments.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allRejectedVisibleSelected}
              onChange={() =>
                setSelectedRejectedIds(
                  allRejectedVisibleSelected ? [] : rejectedVisible.map((c) => c.id)
                )
              }
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            Select all rejected (visible)
          </label>
          <button
            type="button"
            onClick={handleBulkDeleteRejected}
            disabled={selectedRejectedIds.length === 0 || bulkDeleting}
            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {bulkDeleting
              ? "Deleting..."
              : `Delete selected (${selectedRejectedIds.length})`}
          </button>
        </div>
      )}

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
                getCommentStatus(comment) === "approved"
                  ? "border-gray-200"
                  : getCommentStatus(comment) === "rejected"
                    ? "border-red-200 bg-red-50"
                    : "border-yellow-300 bg-yellow-50"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getCommentStatus(comment) === "rejected" && (
                      <input
                        type="checkbox"
                        checked={selectedRejectedIds.includes(comment.id)}
                        onChange={() =>
                          setSelectedRejectedIds((prev) =>
                            prev.includes(comment.id)
                              ? prev.filter((x) => x !== comment.id)
                              : [...prev, comment.id]
                          )
                        }
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                        aria-label={`Select rejected comment ${comment.id}`}
                      />
                    )}
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
                    {getCommentStatus(comment) === "pending" && (
                      <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                        Pending
                      </span>
                    )}
                    {getCommentStatus(comment) === "approved" && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Approved
                      </span>
                    )}
                    {getCommentStatus(comment) === "rejected" && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                        Rejected
                      </span>
                    )}
                  </div>
                  <div 
                    className="text-gray-700 mb-2"
                    dangerouslySetInnerHTML={{ __html: comment.content }}
                  />
          {(() => {
            const articleHref = getArticleHref(comment.articleId);
            return (
              <p className="text-xs text-gray-500">
                Article ID:{" "}
                {articleHref ? (
                  <a
                    href={articleHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                    title="Open article in a new tab"
                  >
                    {comment.articleId}
                  </a>
                ) : (
                  comment.articleId
                )}
              </p>
            );
          })()}
                </div>
                <div className="flex gap-2 ml-4">
                  {getCommentStatus(comment) !== "approved" && (
                    <button
                      onClick={() => handleApprove(comment.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Approve
                    </button>
                  )}
                  {getCommentStatus(comment) !== "rejected" && (
                    <button
                      onClick={() => handleReject(comment.id)}
                      className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      Reject
                    </button>
                  )}
                  {getCommentStatus(comment) === "rejected" && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete forever
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
