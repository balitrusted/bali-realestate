"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";
import { Article } from "@/types/article";

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await fetch("/api/articles");
      const data = await response.json();
      const found = data.articles.find((a: Article) => a.id === id);
      setArticle(found || null);
    } catch (error) {
      console.error("Error fetching article:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (articleData: any) => {
    try {
      const response = await fetch("/api/articles", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        router.push("/admin/articles");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update article");
      }
    } catch (error) {
      console.error("Error updating article:", error);
      alert("Failed to update article");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-8">
        <p>Article not found</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Article</h1>
      <ArticleForm article={article} onSave={handleSave} />
    </div>
  );
}
