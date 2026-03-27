"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SiteRequest, RequestStatus } from "@/lib/requestsData";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  "client-rent": "Client – find property",
  "client-other": "Client – other",
  owner: "Owner/agent",
  specialist: "Specialist",
  "catalog-feedback": "Catalog – no/few results",
  "property-book": "Property – book / enquire",
  "property-info": "Property – info",
  "property-buy": "Property – buy",
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: "New",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_CLASSES: Record<RequestStatus, string> = {
  new: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-gray-200 text-gray-700",
};

function RequestCard({
  r,
  onRequestUpdated,
}: {
  r: SiteRequest;
  onRequestUpdated: (updated: SiteRequest) => void;
}) {
  const status = r.status || "new";
  const [comment, setComment] = useState(r.comment ?? "");
  const [savingComment, setSavingComment] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Sync comment when r changes (e.g. from parent update)
  useEffect(() => {
    setComment(r.comment ?? "");
  }, [r.comment]);

  const saveComment = async () => {
    if (comment === (r.comment ?? "")) return;
    setSavingComment(true);
    try {
      const res = await fetch("/api/request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.request) onRequestUpdated(data.request);
    } finally {
      setSavingComment(false);
    }
  };

  const setStatus = async (newStatus: RequestStatus) => {
    setSavingStatus(true);
    try {
      const res = await fetch("/api/request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.request) onRequestUpdated(data.request);
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500">
          {new Date(r.createdAt).toLocaleString()}
        </span>
        <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_CLASSES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
          {REQUEST_TYPE_LABELS[r.requestType] || r.requestType || "—"}
        </span>
        {status === "done" && (
          <button
            type="button"
            onClick={() => setStatus("new")}
            disabled={savingStatus}
            className="ml-auto px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Reopen
          </button>
        )}
      </div>
      <p className="font-medium text-gray-900">{r.name}</p>
      <p className="text-sm text-gray-600">
        {r.email && r.email !== "—" ? (
          <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>
        ) : (
          <span className="text-gray-500">Email: —</span>
        )}
        {r.whatsapp ? ` · ${r.whatsapp}` : null}
      </p>
      {r.propertyId && <p className="text-sm text-gray-600">Property ID: {r.propertyId}</p>}
      {r.propertyTitle && <p className="text-sm text-gray-600">Listing: {r.propertyTitle}</p>}
      {r.propertyUrl && (
        <p className="text-sm text-gray-600">
          <a href={r.propertyUrl} className="text-emerald-800 hover:underline" target="_blank" rel="noopener noreferrer">
            Open listing
          </a>
        </p>
      )}
      {r.desiredStart && <p className="text-sm text-gray-600">Preferred start: {r.desiredStart}</p>}
      {r.area && <p className="text-sm text-gray-600">Area: {r.area}</p>}
      {r.propertyType && <p className="text-sm text-gray-600">Type: {r.propertyType}</p>}
      {r.message && (
        <p className="text-sm text-gray-700 mt-2 border-t border-gray-100 pt-2 whitespace-pre-wrap">
          {r.message}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {(["new", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              type="button"
              disabled={savingStatus}
              onClick={() => setStatus(s)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors disabled:opacity-50 ${
                status === s
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Comment</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={saveComment}
          disabled={savingComment}
          rows={2}
          placeholder="Your note..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50"
        />
        {savingComment && <span className="text-xs text-gray-400">Saving...</span>}
      </div>
    </div>
  );
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<SiteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = async () => {
    try {
      const res = await fetch("/api/request", { cache: "no-store" });
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

  useEffect(() => {
    fetchList();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading...</div>;
  }

  const normalized = requests.map((r) => ({ ...r, status: (r.status || "new") as RequestStatus }));
  const active = [...normalized].reverse().filter((r) => r.status !== "done");
  const completed = [...normalized].reverse().filter((r) => r.status === "done");

  const handleRequestUpdated = (updated: SiteRequest) => {
    const withStatus = { ...updated, status: (updated.status || "new") as RequestStatus };
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? withStatus : r)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Requests</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={async () => {
              setRefreshing(true);
              await fetchList();
              setRefreshing(false);
            }}
            disabled={refreshing}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <Link href="/admin/properties" className="text-gray-700 hover:text-gray-900">
            Back to Properties
          </Link>
        </div>
      </div>
      <p className="text-gray-600 mb-6">
        Requests from the main form (Send Request). Change status and add comments. Completed requests are listed below.
      </p>
      {normalized.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No requests yet.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-4 mb-8">
              <h2 className="text-lg font-semibold text-gray-900">Active</h2>
              {active.map((r) => (
                <RequestCard key={r.id} r={r} onRequestUpdated={handleRequestUpdated} />
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-600">Completed</h2>
              {completed.map((r) => (
                <RequestCard key={r.id} r={r} onRequestUpdated={handleRequestUpdated} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
