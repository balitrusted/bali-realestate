"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SearchQueryLog } from "@/lib/searchQueryLogs";

export default function AdminSearchQueriesPage() {
  const [rows, setRows] = useState<SearchQueryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryFilter, setQueryFilter] = useState("");

  const fetchRows = async () => {
    try {
      const res = await fetch("/api/admin/search-queries", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load search logs");
      const data = (await res.json()) as { rows?: SearchQueryLog[] };
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch (error) {
      console.error(error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows();
  }, []);

  const filtered = useMemo(() => {
    const f = queryFilter.trim().toLowerCase();
    if (!f) return rows;
    return rows.filter((r) => r.query.toLowerCase().includes(f));
  }, [rows, queryFilter]);

  const topQueries = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = row.query.toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [rows]);

  if (loading) {
    return <div className="py-12 text-center text-gray-600">Loading search logs...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900">Search history</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void fetchRows()}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
          <Link href="/admin/properties" className="text-gray-700 hover:text-gray-900">
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-gray-200 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-gray-800">Top queries</p>
        <div className="flex flex-wrap gap-2">
          {topQueries.length === 0 && <span className="text-sm text-gray-500">No data yet.</span>}
          {topQueries.map(([q, count]) => (
            <span key={q} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-900">
              {q} ({count})
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <input
          type="search"
          value={queryFilter}
          onChange={(e) => setQueryFilter(e.target.value)}
          placeholder="Filter queries..."
          className="w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Time</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Query</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Source</th>
              <th className="px-3 py-2 text-left font-medium text-gray-600">Path</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td className="px-3 py-5 text-gray-500" colSpan={4}>
                  No search entries yet.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-gray-100 align-top">
                <td className="px-3 py-2 text-gray-500">{new Date(row.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{row.query}</td>
                <td className="px-3 py-2 text-gray-700">{row.source}</td>
                <td className="px-3 py-2 text-gray-600">{row.path || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
