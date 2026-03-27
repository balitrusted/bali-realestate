"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatLocaleDate } from "@/lib/formatDate";
import type { BlogPost } from "@/types/blog";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/blog");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog post?")) return;
    try {
      const res = await fetch(`/api/admin/blog?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((p) => p.filter((x) => x.id !== id));
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Delete failed");
      }
    } catch {
      alert("Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading blog posts…</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
        <Link
          href="/admin/blog/add"
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Add post
        </Link>
      </div>
      <p className="text-sm text-gray-600 mb-6 max-w-2xl">
        Public stream at <Link href="/blog" className="underline text-emerald-800" target="_blank">/blog</Link>.
        Posts here are separate from Knowledge Base <strong>Articles</strong> (/guides). Body is HTML — paste from your
        draft and fix links to internal paths (<code className="text-xs">/properties/...</code>).
      </p>

      {posts.length === 0 ? (
        <p className="text-gray-600">No posts yet.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg bg-white"
            >
              <div>
                <div className="font-medium text-gray-900">{p.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  /blog/{p.slug} · {formatLocaleDate(p.publishedAt)}
                  {p.published ? "" : " · draft"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/blog/${p.slug}`}
                  target="_blank"
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  View
                </Link>
                <Link href={`/admin/blog/edit/${p.id}`} className="text-sm text-emerald-800 hover:underline">
                  Edit
                </Link>
                <button type="button" onClick={() => handleDelete(p.id)} className="text-sm text-red-600 hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
