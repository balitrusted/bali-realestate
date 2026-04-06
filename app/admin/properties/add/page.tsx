"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PropertyForm from "@/components/admin/PropertyForm";

export default function AddPropertyPage() {
  const router = useRouter();

  const handleSave = async (property: any) => {
    const response = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(property),
    });

    if (response.ok) {
      router.push("/admin/properties");
    } else {
      let detail = `HTTP ${response.status}`;
      try {
        const data = await response.json();
        if (data?.error) detail = data.error;
      } catch {
        /* ignore */
      }
      alert(detail);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Add New Property</h1>
      <PropertyForm onSave={handleSave} />
    </div>
  );
}
