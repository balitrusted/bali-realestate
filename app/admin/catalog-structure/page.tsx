"use client";

import { useEffect, useState } from "react";
import type { CatalogStructure } from "@/lib/catalogStructure";

type SegmentCategory = keyof CatalogStructure["segmentCategories"];

const CATEGORY_LABELS: Record<SegmentCategory, string> = {
  subArea: "Sub-areas (Ubud)",
  bedroom: "Bedrooms",
  payment: "Payment",
  amenity: "Amenity",
};

export default function AdminCatalogStructurePage() {
  const [structure, setStructure] = useState<CatalogStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addKind, setAddKind] = useState<"type" | "area" | "segment">("type");
  const [addSlug, setAddSlug] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addCategory, setAddCategory] = useState<SegmentCategory>("subArea");
  const [deleting, setDeleting] = useState<{
    kind: "type" | "area" | "segment";
    slug: string;
    category?: SegmentCategory;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchStructure = async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/catalog-structure");
      if (!res.ok) {
        if (res.status === 401) setError("Unauthorized");
        else setError("Failed to load");
        return;
      }
      const data = await res.json();
      setStructure(data);
    } catch {
      setError("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructure();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structure) return;
    const slug = addSlug.trim().toLowerCase();
    if (!slug) return;
    setSaving(true);
    try {
      const body: Record<string, string> =
        addKind === "type"
          ? { kind: "type", slug, labelEn: addLabel.trim() }
          : addKind === "area"
            ? { kind: "area", slug, nameEn: addLabel.trim() }
            : { kind: "segment", category: addCategory, slug };
      const res = await fetch("/api/admin/catalog-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to add");
        return;
      }
      setStructure(data);
      setAddSlug("");
      setAddLabel("");
    } catch {
      alert("Request failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const body =
        deleting.kind === "segment"
          ? { kind: "segment", category: deleting.category, slug: deleting.slug }
          : { kind: deleting.kind, slug: deleting.slug };
      const res = await fetch("/api/admin/catalog-structure", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete");
        return;
      }
      setStructure(data);
      setDeleting(null);
    } catch {
      alert("Request failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-gray-600">Loading catalog structure…</div>
    );
  }

  if (error || !structure) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        {error || "No data"}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Catalog structure</h1>
      <p className="text-sm text-gray-600">
        Parameters and sub-parameters used in the property catalog (SEO slugs). Data is stored in{" "}
        <code className="rounded bg-gray-200 px-1">data/catalog-structure.json</code>. The site
        currently uses built-in lists; this file is used for reference and future override.
      </p>

      {/* Types */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Types (level 1)</h2>
        <ul className="mb-4 list-inside list-disc text-sm text-gray-700">
          {structure.types.map((t) => (
            <li key={t.slug} className="flex items-center gap-2">
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{t.slug}</code>
              <span>{t.labelEn}</span>
              <button
                type="button"
                onClick={() => setDeleting({ kind: "type", slug: t.slug })}
                className="ml-2 text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Areas */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Areas (level 2)</h2>
        <ul className="mb-4 list-inside list-disc text-sm text-gray-700">
          {structure.areas.map((a) => (
            <li key={a.slug} className="flex items-center gap-2">
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{a.slug}</code>
              <span>{a.nameEn}</span>
              <button
                type="button"
                onClick={() => setDeleting({ kind: "area", slug: a.slug })}
                className="ml-2 text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Segment categories */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Segment categories (sub-parameters)</h2>
        {(Object.keys(structure.segmentCategories) as SegmentCategory[]).map((cat) => (
          <div key={cat} className="mb-4">
            <h3 className="text-sm font-medium text-gray-700">{CATEGORY_LABELS[cat]}</h3>
            <ul className="mt-1 list-inside list-disc text-sm text-gray-600">
              {structure.segmentCategories[cat].map((slug) => (
                <li key={slug} className="flex items-center gap-2">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">{slug}</code>
                  <button
                    type="button"
                    onClick={() => setDeleting({ kind: "segment", category: cat, slug })}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Add form */}
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Add parameter</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">Kind</span>
            <select
              value={addKind}
              onChange={(e) => setAddKind(e.target.value as "type" | "area" | "segment")}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="type">Type</option>
              <option value="area">Area</option>
              <option value="segment">Segment</option>
            </select>
          </label>
          {addKind === "segment" && (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">Category</span>
              <select
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value as SegmentCategory)}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                {(Object.keys(CATEGORY_LABELS) as SegmentCategory[]).map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gray-600">SEO slug</span>
            <input
              type="text"
              value={addSlug}
              onChange={(e) => setAddSlug(e.target.value)}
              placeholder="e.g. villas"
              className="rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </label>
          {(addKind === "type" || addKind === "area") && (
            <label className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">{addKind === "type" ? "Label (EN)" : "Name (EN)"}</span>
              <input
                type="text"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="Display name"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </label>
          )}
          <button
            type="submit"
            disabled={saving || !addSlug.trim()}
            className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Add"}
          </button>
        </form>
      </section>

      {/* Delete confirmation modal */}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 id="delete-title" className="text-lg font-semibold text-gray-900">
              Confirm deletion
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {deleting.kind === "type" && (
                <>Delete type <strong>{deleting.slug}</strong>? This will remove it from the catalog structure file.</>
              )}
              {deleting.kind === "area" && (
                <>Delete area <strong>{deleting.slug}</strong>? This will remove it from the catalog structure file.</>
              )}
              {deleting.kind === "segment" && (
                <>Delete segment <strong>{deleting.slug}</strong> from {deleting.category}? This will remove it from the catalog structure file.</>
              )}
            </p>
            <p className="mt-2 text-xs text-amber-700">
              The live site currently uses built-in lists; this only updates the stored structure.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={saving}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
