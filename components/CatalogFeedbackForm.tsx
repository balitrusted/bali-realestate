"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackLead } from "@/lib/analytics";
import { getRequestAttributionForSubmit } from "@/lib/attributionClient";
import { PropertyType, MainArea } from "@/types/property";
import { areas } from "@/types/areas";

const VALID_TYPES: PropertyType[] = ["rent", "sale", "land", "business", "hotels"];
const MAIN_AREAS: MainArea[] = ["ubud", "canggu", "sanur", "seminyak", "tanah-lot"];

const AMENITY_KEYS = [
  "hasPool", "hasBathtub", "hasClosedKitchen", "hasEnclosedLiving", "hasNatureView",
  "hasCarPark", "hasDesk", "hasPetFriendly", "hasGarage", "hasHighSpeedWifi", "hasWashingMachine",
] as const;
const AMENITY_LABELS: Record<string, string> = {
  hasPool: "Pool", hasBathtub: "Bathtub", hasClosedKitchen: "Enclosed kitchen",
  hasEnclosedLiving: "Enclosed living", hasNatureView: "Nature view", hasCarPark: "Car park",
  hasDesk: "Desk", hasPetFriendly: "Pet friendly", hasGarage: "Garage",
  hasHighSpeedWifi: "High-speed WiFi", hasWashingMachine: "Washing machine",
};

function parsePath(pathname: string): { pathType: PropertyType | null; pathArea: MainArea | null } {
  const parts = pathname.replace(/\/$/, "").split("/");
  if (parts[1] !== "properties") return { pathType: null, pathArea: null };
  const pathType = parts[2] && VALID_TYPES.includes(parts[2] as PropertyType) ? (parts[2] as PropertyType) : null;
  const pathArea = parts[3] && MAIN_AREAS.includes(parts[3] as MainArea) ? (parts[3] as MainArea) : null;
  return { pathType, pathArea };
}

function buildFilterSummary(pathname: string, searchParams: URLSearchParams): string {
  const { pathType, pathArea } = parsePath(pathname);
  const parts: string[] = [];
  const both = searchParams.get("both") === "1";
  const typeFromQuery = searchParams.get("type");
  const type = pathType ?? typeFromQuery;
  if (both) parts.push("Type: rent and buy (both)");
  else if (type) parts.push(`Type: ${type}`);
  const mainArea = pathArea ?? searchParams.get("mainArea");
  if (mainArea) {
    const areaName = areas[mainArea as MainArea]?.nameEn ?? mainArea;
    parts.push(`Area: ${areaName}`);
  }
  const bedrooms = searchParams.get("bedrooms");
  if (bedrooms) parts.push(`Bedrooms: ${bedrooms}`);
  const minDuration = searchParams.get("minDuration");
  if (minDuration) parts.push(`Payment: ${minDuration === "12" ? "yearly" : "monthly"}`);
  AMENITY_KEYS.forEach((k) => {
    if (searchParams.get(k) === "true") parts.push(AMENITY_LABELS[k] ?? k);
  });
  return parts.join(" · ");
}

interface CatalogFeedbackFormProps {
  total: number;
}

export default function CatalogFeedbackForm({ total }: CatalogFeedbackFormProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sent, setSent] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterSummary = buildFilterSummary(pathname ?? "", searchParams);

  const submit = async (withComment: boolean) => {
    setError(null);
    setLoading(true);
    const body: Record<string, string> = {
      requestType: "catalog-feedback",
      name: "Catalog search",
      email: email.trim() || "—",
      message: filterSummary + (withComment && comment.trim() ? "\n\nComment: " + comment.trim() : ""),
    };
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          attribution: getRequestAttributionForSubmit(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSent(true);
      setShowComment(false);
      trackLead("catalog-feedback");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-gray-900 mb-1">Feedback sent. Thank you!</p>
        <p className="text-sm text-gray-600 mb-4">We’ll use it to add more listings that match what you’re looking for.</p>
        {!showComment ? (
          <button
            type="button"
            onClick={() => setShowComment(true)}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800 underline"
          >
            Add a comment or request a specialist search
          </button>
        ) : (
          <div className="max-w-md mx-auto text-left mt-4 space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="your@email.com"
            />
            <label className="block text-sm font-medium text-gray-700">Comment or request</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Describe what you’re looking for in your own words..."
            />
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const isZero = total === 0;

  return (
    <div className={`rounded-xl border border-gray-200 p-6 ${isZero ? "bg-gray-50" : "bg-white"}`}>
      {isZero ? (
        <>
          <p className="font-semibold text-gray-900 mb-2">No properties match your criteria.</p>
          <p className="text-sm text-gray-600 mb-4">
            Tell us what you’re looking for and we’ll consider adding such listings to the catalog.
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold text-gray-900 mb-2">Only {total} {total === 1 ? "option" : "options"} found.</p>
          <p className="text-sm text-gray-600 mb-4">
            Want us to add more? Send a quick note and we’ll keep it in mind.
          </p>
        </>
      )}
      <button
        type="button"
        onClick={() => submit(false)}
        disabled={loading}
        className="px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? "Sending…" : "Tell us what you’re looking for"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
