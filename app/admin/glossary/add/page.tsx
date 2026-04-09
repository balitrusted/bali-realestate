"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import GlossaryTermForm from "@/components/admin/GlossaryTermForm";

export default function AdminAddGlossaryTermPage() {
  const router = useRouter();

  const handleSave = async (payload: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/admin/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/admin/glossary" className="text-sm text-gray-600 hover:text-gray-900">
          ← Glossary
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New term</h1>
      </div>
      <GlossaryTermForm onSave={handleSave} />
    </div>
  );
}
