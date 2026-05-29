"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { NotifyRequest } from "@/lib/notifyRequestsData";

function isUnread(r: NotifyRequest): boolean {
  return !r.readAt;
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fireAdminBadgesRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("admin-badges-refresh"));
}

async function markNotifySeen(options?: { requestId?: string }) {
  const res = await fetch("/api/admin/badge-seen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      section: "notify",
      ...(options?.requestId ? { requestId: options.requestId } : {}),
    }),
  });
  if (!res.ok) throw new Error("Failed to update read state");
  fireAdminBadgesRefresh();
}

export default function AdminNotifyRequestsPage() {
  const [requests, setRequests] = useState<NotifyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/notify-requests");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const unreadCount = useMemo(
    () => requests.filter(isUnread).length,
    [requests]
  );

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markNotifySeen();
      setRequests((prev) =>
        prev.map((r) => ({
          ...r,
          readAt: r.readAt ?? new Date().toISOString(),
        }))
      );
    } catch (e) {
      console.error(e);
      alert("Could not mark as read. Try again or run the Supabase migration for read_at.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkOneRead = async (id: string) => {
    setMarkingId(id);
    try {
      await markNotifySeen({ requestId: id });
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, readAt: r.readAt ?? new Date().toISOString() } : r
        )
      );
    } catch (e) {
      console.error(e);
      alert("Could not mark this row as read.");
    } finally {
      setMarkingId(null);
    }
  };

  const downloadCsv = () => {
    const headers = ["Date", "Property ID", "Property title", "Name", "Email", "Needed from", "Read"];
    const rows = requests.map((r) => [
      r.createdAt,
      r.propertyId,
      r.propertyTitle,
      r.name,
      r.email,
      r.dateFrom ?? "",
      r.readAt ? "yes" : "no",
    ]);
    const csv = [headers.map(escapeCsvCell).join(","), ...rows.map((row) => row.map(escapeCsvCell).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notify-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notify requests</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-sky-800">
              {unreadCount} unread {unreadCount === 1 ? "request" : "requests"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition-colors disabled:opacity-60"
            >
              {markingAll ? "Saving…" : "Mark all as read"}
            </button>
          )}
          <button
            type="button"
            onClick={downloadCsv}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Download CSV (Excel)
          </button>
          <Link href="/admin/properties" className="text-gray-700 hover:text-gray-900">
            Back to Properties
          </Link>
        </div>
      </div>
      <p className="text-gray-600 mb-6">
        Clients who asked to be notified when an archived villa becomes available. Unread rows stay in the
        nav badge until you mark them read (stored in the database, not only in the browser).
      </p>
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">No requests yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Needed from</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[...requests].reverse().map((r) => {
                  const unread = isUnread(r);
                  return (
                    <tr
                      key={r.id}
                      className={unread ? "bg-sky-50/60 hover:bg-sky-50" : "hover:bg-gray-50"}
                    >
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/properties/view/${r.propertyId}`}
                          target="_blank"
                          className="text-gray-900 hover:underline"
                        >
                          {r.propertyTitle || r.propertyId}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{r.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <a href={`mailto:${r.email}`} className="hover:underline">
                          {r.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{r.dateFrom || "—"}</td>
                      <td className="px-4 py-3 text-sm">
                        {unread ? (
                          <button
                            type="button"
                            onClick={() => handleMarkOneRead(r.id)}
                            disabled={markingId === r.id}
                            className="text-sky-700 hover:text-sky-900 font-medium disabled:opacity-60"
                          >
                            {markingId === r.id ? "…" : "Mark read"}
                          </button>
                        ) : (
                          <span className="text-gray-400">Read</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
