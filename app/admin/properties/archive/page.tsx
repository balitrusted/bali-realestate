"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PropertyImageWithFallback from "@/components/PropertyImageWithFallback";
import { Property } from "@/types/property";
import { getPropertyDisplayTitle } from "@/lib/propertyUtils";

export default function AdminArchivePage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArchived = async () => {
      try {
        const res = await fetch("/api/properties?archived=true", {
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

  const handleDelete = async (property: Property) => {
    if (
      !confirm(
        `Permanently delete "${getPropertyDisplayTitle(property)}"?\n\nThis cannot be undone. Use only if this listing should never appear on the site again.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/properties?id=${encodeURIComponent(property.id)}`, {
        method: "DELETE",
        cache: "no-store",
      });
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== property.id));
      } else {
        alert("Failed to delete");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete");
    }
  };

  const handleRestore = async (property: Property) => {
    if (!confirm(`Restore "${getPropertyDisplayTitle(property)}" to the main list?`)) return;
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
      if (res.ok) {
        setProperties((prev) => prev.filter((p) => p.id !== property.id));
      } else {
        alert("Failed to restore");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to restore");
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "IDR") return `${(price / 1000000).toFixed(0)}M IDR`;
    return `$${price.toLocaleString()}`;
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading archive...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Archive</h1>
        <Link
          href="/admin/properties"
          className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
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
                    onClick={() => handleRestore(property)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm whitespace-nowrap"
                  >
                    Restore
                  </button>
                  <Link
                    href={`/admin/properties/edit/${property.id}`}
                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm text-center whitespace-nowrap"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(property)}
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
    </div>
  );
}
