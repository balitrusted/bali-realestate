"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SiteRequest } from "@/lib/requestsData";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  "client-rent": "Client – find property",
  "client-other": "Client – other",
  owner: "Owner/agent",
  specialist: "Specialist",
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<SiteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch("/api/request");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        setRequests(data.requests || []);
      } catch (e) {
        console.error(e);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Requests</h1>
        <Link href="/admin/properties" className="text-gray-700 hover:text-gray-900">
          Back to Properties
        </Link>
      </div>
      <p className="text-gray-600 mb-6">
        Requests from the main form (Send Request). You also receive them by email if RESEND_API_KEY and ADMIN_EMAIL are set.
      </p>
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...requests].reverse().map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-500">
                  {new Date(r.createdAt).toLocaleString()}
                </span>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                  {REQUEST_TYPE_LABELS[r.requestType] || r.requestType || "—"}
                </span>
              </div>
              <p className="font-medium text-gray-900">{r.name}</p>
              <p className="text-sm text-gray-600">
                <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>
                {r.whatsapp && ` · ${r.whatsapp}`}
              </p>
              {r.area && <p className="text-sm text-gray-600">Area: {r.area}</p>}
              {r.propertyType && <p className="text-sm text-gray-600">Type: {r.propertyType}</p>}
              {r.message && (
                <p className="text-sm text-gray-700 mt-2 border-t border-gray-100 pt-2 whitespace-pre-wrap">
                  {r.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
