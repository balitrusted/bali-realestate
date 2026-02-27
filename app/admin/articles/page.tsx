"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Article } from "@/types/article";

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch("/api/articles");
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) {
      return;
    }

    try {
      const response = await fetch(`/api/articles?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchArticles();
      }
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Failed to delete article");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        <Link
          href="/admin/articles/add"
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Add New Article
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No articles yet.</p>
          <Link
            href="/admin/articles/add"
            className="text-gray-900 underline"
          >
            Create your first article
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {article.title}
                    </h3>
                    {!article.published && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        Draft
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded capitalize">
                      {article.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {article.excerpt || "No excerpt"}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Slug: {article.slug}</span>
                    <span>Author: {article.author}</span>
                    {article.publishedAt && (
                      <span>Published: {new Date(article.publishedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/admin/articles/edit/${article.id}`}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(article.id)}
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
