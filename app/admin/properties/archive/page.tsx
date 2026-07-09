"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PropertyImageWithFallback from "@/components/PropertyImageWithFallback";
import PropertyCommentModal from "@/components/admin/PropertyCommentModal";
import { Property } from "@/types/property";
import { getPropertyDisplayTitle } from "@/lib/propertyUtils";

export default function AdminArchivePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    const fetchArchived = async () => {
      try {
        const res = await fetch(`/api/properties?archived=true&_=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await res.json();
        setProperties((data.properties || []).filter((p: Property) => p?.id));
      } catch (e) {
        console.error(e);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArchived();
  }, []);

  const handleDelete = async (property: Property, comment: string) => {
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/properties?id=${encodeURIComponent(property.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (Array.isArray(data.archivedProperties)) {
          setProperties(
            data.archivedProperties.filter((p: Property) => p?.id)
          );
        } else {
          setProperties((prev) => prev.filter((p) => p.id !== property.id));
        }
        setDeleteTarget(null);
      } else {
        alert(typeof data?.error === "string" ? data.error : "Failed to delete");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleRestore = async (property: Property) => {
    setRestoringId(property.id);
    try {
      const res = await fetch("/api/properties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action: "update",
          property: { ...property, archived: false },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (Array.isArray(data.archivedProperties)) {
          setProperties(
            data.archivedProperties.filter((p: Property) => p?.id)
          );
        } else {
          setProperties((prev) => prev.filter((p) => p.id !== property.id));
        }
      } else {
        alert(typeof data?.error === "string" ? data.error : "Failed to restore");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to restore");
    } finally {
      setRestoringId(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "IDR") return `${(price / 1000000).toFixed(0)}M IDR`;
    return `$${price.toLocaleString()}`;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading archive...</div>;
  }

  const archivedCount = properties.length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Archive</h1>
          <p className="mt-1 text-sm text-gray-600 tabular-nums">
            <span className="font-semibold text-gray-900">{archivedCount}</span>
            {" "}
            archived {archivedCount === 1 ? "listing" : "listings"}
          </p>
        </div>
        <Link
          href="/admin/properties"
          className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors shrink-0 self-start"
        >
          Back to Properties
        </Link>
      </div>
      <p className="text-gray-600 mb-6">
        Archived villas are hidden from the catalog and main list. Direct links still work; the page shows &quot;Not available&quot; and the notify form.{" "}
        <strong className="font-medium text-gray-800">Permanent delete</strong> is only available here (not on the main Properties list).
      </p>
      {properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No archived properties.</p>
          <Link href="/admin/properties" className="text-gray-900 underline mt-2 inline-block">
            Back to Properties
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((property) => {
            const price = property.price || { min: 0, currency: "IDR" as const };
            const hasPrice = price.monthly != null || price.yearly != null || price.min != null;
            const priceStr = hasPrice
              ? formatPrice(price.monthly ?? price.min ?? 0, price.currency || "IDR")
              : "—";
            const mainImage = property.images?.[0];
            return (
              <div
                key={property.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
              >
                {mainImage ? (
                  <div className="w-24 h-24 relative rounded overflow-hidden flex-shrink-0">
                    <PropertyImageWithFallback
                      src={mainImage}
                      alt={getPropertyDisplayTitle(property)}
                      fill
                      className="object-cover"
                      sizes="96px"
                      placeholderText="No image"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-400">No image</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {getPropertyDisplayTitle(property)}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">
                    {property.internalName || property.villaNumber || property.id}
                  </p>
                  <span className="text-sm text-gray-600">{priceStr}</span>
                  <span className="text-xs text-gray-400 ml-2">Order: {property.order ?? 999}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleRestore(property)}
                    disabled={restoringId === property.id}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm whitespace-nowrap disabled:opacity-60"
                  >
                    {restoringId === property.id ? "Restoring..." : "Restore"}
                  </button>
                  <Link
                    href={`/admin/properties/edit/${property.id}?from=archive`}
                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm text-center whitespace-nowrap"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(property)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                  >
                    Delete permanently
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PropertyCommentModal
        open={deleteTarget != null}
        title="Delete listing permanently"
        description={
          deleteTarget
            ? `Permanently delete "${getPropertyDisplayTitle(deleteTarget)}"? This cannot be undone.`
            : undefined
        }
        commentLabel="Comment"
        commentPlaceholder="Why is this listing being removed permanently?"
        submitLabel="Delete permanently"
        submitClassName="bg-red-600 hover:bg-red-700"
        loading={deleteSubmitting}
        onClose={() => {
          if (!deleteSubmitting) setDeleteTarget(null);
        }}
        onSubmit={(comment) => {
          if (deleteTarget) {
            void handleDelete(deleteTarget, comment);
          }
        }}
      />
    </div>
  );
}
