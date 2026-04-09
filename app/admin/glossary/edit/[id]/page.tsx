"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import GlossaryTermForm from "@/components/admin/GlossaryTermForm";
import type { GlossaryTerm } from "@/types/glossary";

export default function AdminEditGlossaryTermPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/glossary");
        if (res.ok) {
          const data = await res.json();
          const found = (data.terms as GlossaryTerm[]).find((t) => t.id === id);
          setTerm(found || null);
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
      const res = await fetch("/api/admin/glossary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id }),
      });
      if (res.ok) {
        router.push("/admin/glossary");
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

  if (!term) {
    return (
      <div className="p-8">
        <p>Term not found.</p>
        <Link href="/admin/glossary" className="text-emerald-800 underline">
          Back to Glossary admin
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/glossary" className="text-sm text-gray-600 hover:text-gray-900">
          ← Glossary
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Edit term</h1>
      </div>
      <GlossaryTermForm term={term} onSave={handleSave} />
    </div>
  );
}
