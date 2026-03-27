"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BlogPostForm from "@/components/admin/BlogPostForm";
import type { BlogPost } from "@/types/blog";

export default function AdminEditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/blog");
        if (res.ok) {
          const data = await res.json();
          const found = (data.posts as BlogPost[]).find((p) => p.id === id);
          setPost(found || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSave = async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin/blog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id }),
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

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading…</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8">
        <p>Post not found.</p>
        <Link href="/admin/blog" className="text-emerald-800 underline">
          Back to Blog admin
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/blog" className="text-sm text-gray-600 hover:text-gray-900">
          ← Blog posts
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit post</h1>
      </div>
      <BlogPostForm post={post} onSave={handleSave} />
    </div>
  );
}
