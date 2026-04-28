"use client";

import { useEffect, useMemo, useState } from "react";
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
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<RequestStatus, string> = {
  new: "bg-sky-100 text-sky-800",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-gray-200 text-gray-700",
  cancelled: "bg-rose-100 text-rose-800",
};

type RequestsTab = "all" | "active" | "done" | "cancelled";

function getRequestStatus(r: SiteRequest): RequestStatus {
  return r.status || "new";
}

function fireAdminBadgesRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("admin-badges-refresh"));
}

function resolveCardMode(tab: RequestsTab, r: SiteRequest): "active" | "done" | "cancelled" {
  if (tab === "active") return "active";
  if (tab === "done") return "done";
  if (tab === "cancelled") return "cancelled";
  const s = getRequestStatus(r);
  if (s === "cancelled") return "cancelled";
  if (s === "done") return "done";
  return "active";
}

function RequestCard({
  r,
  cardMode,
  onRequestUpdated,
  onRequestDeleted,
}: {
  r: SiteRequest;
  cardMode: "active" | "done" | "cancelled";
  onRequestUpdated: (updated: SiteRequest) => void;
  onRequestDeleted: (id: string) => void;
}) {
  const status = getRequestStatus(r);
  const [comment, setComment] = useState(r.comment ?? "");
  const [savingComment, setSavingComment] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      if (res.ok && data.request) {
        onRequestUpdated(data.request);
        fireAdminBadgesRefresh();
      }
    } finally {
      setSavingComment(false);
    }
  };

  const setStatus = async (newStatus: RequestStatus) => {
    const previous = r;
    const optimistic: SiteRequest = { ...r, status: newStatus };
    onRequestUpdated(optimistic);
    setSavingStatus(true);
    try {
      const res = await fetch("/api/request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, status: newStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.request) {
        onRequestUpdated(data.request);
        fireAdminBadgesRefresh();
      } else {
        onRequestUpdated(previous);
      }
    } catch {
      onRequestUpdated(previous);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this request permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/request?id=${encodeURIComponent(r.id)}`, { method: "DELETE" });
      if (res.ok) {
        onRequestDeleted(r.id);
        fireAdminBadgesRefresh();
      }
    } finally {
      setDeleting(false);
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
      </div>
      <p className="font-medium text-gray-900">{r.name}</p>
      <p className="text-sm text-gray-600">
        {r.email && r.email !== "—" ? (
          <a href={`mailto:${r.email}`} className="hover:underline">
            {r.email}
          </a>
        ) : (
          <span className="text-gray-500">Email: —</span>
        )}
        {r.whatsapp ? ` · ${r.whatsapp}` : null}
      </p>
      {r.propertyId && <p className="text-sm text-gray-600">Property ID: {r.propertyId}</p>}
      {r.propertyTitle && <p className="text-sm text-gray-600">Listing: {r.propertyTitle}</p>}
      {r.propertyUrl && (
        <p className="text-sm text-gray-600">
          <a
            href={r.propertyUrl}
            className="text-emerald-800 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
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
        {cardMode === "cancelled" ? (
          <>
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
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </>
        ) : (
          <>
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
            {cardMode === "done" && (
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setStatus("new")}
                  disabled={savingStatus}
                  className="px-2.5 py-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Reopen (New)
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                type="button"
                onClick={() => setStatus("cancelled")}
                disabled={savingStatus || status === "cancelled"}
                className="px-2.5 py-1 text-xs rounded border border-rose-200 text-rose-800 bg-rose-50 hover:bg-rose-100 disabled:opacity-50"
              >
                Cancel request
              </button>
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
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<SiteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<RequestsTab>("active");

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

  const normalized = useMemo(
    () => requests.map((r) => ({ ...r, status: getRequestStatus(r) })),
    [requests]
  );

  const counts = useMemo(() => {
    const all = normalized.length;
    const active = normalized.filter((r) => {
      const s = getRequestStatus(r);
      return s === "new" || s === "in_progress";
    }).length;
    const done = normalized.filter((r) => getRequestStatus(r) === "done").length;
    const cancelled = normalized.filter((r) => getRequestStatus(r) === "cancelled").length;
    return { all, active, done, cancelled };
  }, [normalized]);

  const filtered = useMemo(() => {
    const newestFirst = [...normalized].reverse();
    if (tab === "all") return newestFirst;
    if (tab === "active") {
      return newestFirst.filter((r) => {
        const s = getRequestStatus(r);
        return s === "new" || s === "in_progress";
      });
    }
    if (tab === "done") return newestFirst.filter((r) => getRequestStatus(r) === "done");
    return newestFirst.filter((r) => getRequestStatus(r) === "cancelled");
  }, [normalized, tab]);

  const handleRequestUpdated = (updated: SiteRequest) => {
    const withStatus = { ...updated, status: getRequestStatus(updated) };
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? withStatus : r)));
  };

  const handleRequestDeleted = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading...</div>;
  }

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
        Use tabs to separate active work, completed requests, and cancelled ones. Delete is only
        available for cancelled requests.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`px-4 py-2 rounded-md text-sm ${
            tab === "all" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          All ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`px-4 py-2 rounded-md text-sm ${
            tab === "active" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Active ({counts.active})
        </button>
        <button
          type="button"
          onClick={() => setTab("done")}
          className={`px-4 py-2 rounded-md text-sm ${
            tab === "done" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Done ({counts.done})
        </button>
        <button
          type="button"
          onClick={() => setTab("cancelled")}
          className={`px-4 py-2 rounded-md text-sm ${
            tab === "cancelled" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          Cancelled ({counts.cancelled})
        </button>
      </div>

      {normalized.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No requests yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No requests in this tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <RequestCard
              key={r.id}
              r={r}
              cardMode={resolveCardMode(tab, r)}
              onRequestUpdated={handleRequestUpdated}
              onRequestDeleted={handleRequestDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
