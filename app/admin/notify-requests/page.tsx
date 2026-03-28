"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NotifyRequest } from "@/lib/notifyRequestsData";

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AdminNotifyRequestsPage() {
  const [requests, setRequests] = useState<NotifyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
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
    };
    fetchList();
  }, []);

  useEffect(() => {
    fetch("/api/admin/badge-seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: "notify" }),
    })
      .then(() => {
        window.dispatchEvent(new CustomEvent("admin-badges-refresh"));
      })
      .catch(() => {});
  }, []);

  const downloadCsv = () => {
    const headers = ["Date", "Property ID", "Property title", "Name", "Email", "Needed from"];
    const rows = requests.map((r) => [
      r.createdAt,
      r.propertyId,
      r.propertyTitle,
      r.name,
      r.email,
      r.dateFrom ?? "",
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notify requests</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadCsv}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Download CSV (Excel)
          </button>
          <Link
            href="/admin/properties"
            className="text-gray-700 hover:text-gray-900"
          >
            Back to Properties
          </Link>
        </div>
      </div>
      <p className="text-gray-600 mb-6">
        Clients who asked to be notified when an archived villa becomes available. Export to CSV to open in Excel.
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[...requests].reverse().map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
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
                      <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{r.dateFrom || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
