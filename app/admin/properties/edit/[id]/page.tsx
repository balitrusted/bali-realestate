"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PropertyForm from "@/components/admin/PropertyForm";
import PropertyHistoryPanel from "@/components/admin/PropertyHistoryPanel";
import { Property } from "@/types/property";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const idsQuery =
      id.includes("\uFFFD")
        ? `${encodeURIComponent(id)},${encodeURIComponent(id.replace(/\uFFFD/g, "A"))}`
        : encodeURIComponent(id);
    fetch(`/api/properties?ids=${idsQuery}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        let prop = data.properties?.find((p: Property) => p.id === id);
        if (!prop && id.includes("\uFFFD")) {
          const normalizedId = id.replace(/\uFFFD/g, "A");
          prop = data.properties?.find((p: Property) => p.id === normalizedId);
        }
        setProperty(prop || null);
        setLoading(false);
      });
  }, [id]);

  const handleSave = async (updatedProperty: any) => {
    const response = await fetch("/api/properties", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        action: "update",
        property: { ...updatedProperty, id: property?.id ?? id },
      }),
    });

    if (response.ok) {
      const targetId = property?.id ?? id;
      router.push(targetId ? `/admin/properties?scrollTo=${encodeURIComponent(targetId)}` : "/admin/properties");
    } else {
      let detail = `HTTP ${response.status}`;
      try {
        const data = await response.json();
        if (data?.error) detail += `: ${data.error}`;
      } catch {
        /* ignore */
      }
      alert(`Error updating property — ${detail}`);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading...</div>;
  }

  if (!property) {
    return <div className="text-center py-12 text-gray-600">Property not found</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Edit Property</h1>
      <PropertyForm property={property} onSave={handleSave} />
      <PropertyHistoryPanel propertyId={property.id} />
    </div>
  );
}
