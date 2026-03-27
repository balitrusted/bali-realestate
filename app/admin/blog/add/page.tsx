"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import BlogPostForm from "@/components/admin/BlogPostForm";

export default function AdminAddBlogPostPage() {
  const router = useRouter();

  const handleSave = async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/admin/blog");
        return;
      }
      const d = await res.json().catch(() => ({}));
      alert(d.error || `Save failed (HTTP ${res.status})`);
    } catch {
      alert("Save failed");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/blog" className="text-sm text-gray-600 hover:text-gray-900">
          ← Blog posts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New blog post</h1>
      </div>
      <BlogPostForm onSave={handleSave} />
    </div>
  );
}
