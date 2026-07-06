"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { QaQuestion } from "@/types/qa";
import { qaCategoryLabel } from "@/lib/qaHub";

export default function AdminQaPage() {
  const [questions, setQuestions] = useState<QaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/qa");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question and all answers?")) return;
    try {
      const res = await fetch(`/api/admin/qa?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((q) => q.filter((x) => x.id !== id));
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Delete failed");
      }
    } catch {
      alert("Delete failed");
    }
  };

  const handleSeed = async () => {
    if (!confirm("Upsert bundled seed questions into Supabase?")) return;
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(`Seeded ${data.questions} questions and ${data.answers} answers.`);
        await load();
      } else {
        alert(data.error || "Seed failed");
      }
    } catch {
      alert("Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div>
        <p>Loading Q&amp;A…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Q&amp;A</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            {seeding ? "Seeding…" : "Seed bundled data"}
          </button>
          <Link
            href="/admin/qa/add"
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Add question
          </Link>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6 max-w-2xl">
        Public hub at{" "}
        <Link href="/qa" className="underline text-emerald-800" target="_blank">
          /qa
        </Link>
        . Virtual authors use display names only (no Supabase auth rows). Run SQL migration{" "}
        <code className="text-xs">004_qa.sql</code> before seeding to production.
      </p>

      {questions.length === 0 ? (
        <p className="text-gray-600">No questions in database. Use seed or add manually.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg bg-white"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900">{q.title}</div>
                <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-2">
                  <span>/qa/{q.slug}</span>
                  <span>· {qaCategoryLabel(q.category)}</span>
                  <span>· {q.authorDisplayName}</span>
                  {q.authorEmail ? <span>· {q.authorEmail}</span> : null}
                  <span>· {q.answerCount} answers</span>
                  {q.status !== "published" ? (
                    <span className="text-amber-700 font-medium">· pending moderation</span>
                  ) : null}
                  {q.isSeeded ? <span>· seeded</span> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/qa/${q.slug}`}
                  target="_blank"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  View
                </Link>
                <Link
                  href={`/admin/qa/edit/${encodeURIComponent(q.id)}`}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(q.id)}
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
