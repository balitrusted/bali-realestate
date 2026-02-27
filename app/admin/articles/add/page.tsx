"use client";

import { useRouter } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";

export default function AddArticlePage() {
  const router = useRouter();

  const handleSave = async (articleData: any) => {
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        router.push("/admin/articles");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create article");
      }
    } catch (error) {
      console.error("Error creating article:", error);
      alert("Failed to create article");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Article</h1>
      <ArticleForm onSave={handleSave} />
    </div>
  );
}
