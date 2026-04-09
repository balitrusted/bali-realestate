"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GlossaryTerm } from "@/types/glossary";
import { glossaryCategoryLabel } from "@/lib/glossaryHub";

export default function AdminGlossaryPage() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/glossary");
        if (res.ok) {
          const data = await res.json();
          setTerms(data.terms || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this glossary term?")) return;
    try {
      const res = await fetch(`/api/admin/glossary?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setTerms((t) => t.filter((x) => x.id !== id));
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
        <p>Loading glossary…</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Glossary</h1>
        <Link
          href="/admin/glossary/add"
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Add term
        </Link>
      </div>
      <p className="text-sm text-gray-600 mb-6 max-w-2xl">
        Public hub at{" "}
        <Link href="/glossary" className="underline text-emerald-800" target="_blank">
          /glossary
        </Link>
        . Body is HTML; use internal paths like <code className="text-xs">/guides/legal</code>.
      </p>

      {terms.length === 0 ? (
        <p className="text-gray-600">No terms yet.</p>
      ) : (
        <div className="space-y-3">
          {terms.map((t) => (
            <div
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg bg-white"
            >
              <div>
                <div className="font-medium text-gray-900">{t.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  /glossary/{t.slug} · {glossaryCategoryLabel(t.category)}
                  {!t.published ? " · draft" : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/glossary/edit/${encodeURIComponent(t.id)}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(t.id)}
                  className="px-3 py-1.5 text-sm text-red-700 border border-red-200 rounded-md hover:bg-red-50"
                >
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
