"use client";

import { useEffect, useState } from "react";
import type { PropertyEvent } from "@/lib/propertyEvents";
import {
  formatPropertyFieldLabel,
  formatPropertyFieldValue,
} from "@/lib/propertyChangeDiff";
import { formatLocaleDate } from "@/lib/formatDate";

const EVENT_LABELS: Record<PropertyEvent["eventType"], string> = {
  created: "Created",
  updated: "Updated",
  archived: "Archived",
  restored: "Restored",
  deleted: "Deleted permanently",
};

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${formatLocaleDate(iso.slice(0, 10))} · ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function PropertyHistoryPanel({ propertyId }: { propertyId: string }) {
  const [events, setEvents] = useState<PropertyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/admin/property-events?propertyId=${encodeURIComponent(propertyId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : "Failed to load history");
        }
        if (!cancelled) {
          setEvents(Array.isArray(data.events) ? data.events : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load history");
          setEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return (
    <section className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-gray-900">History</h2>
      <p className="mt-1 text-sm text-gray-600">
        Full change log for this listing, including archive and restore events.
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-gray-500">Loading history…</p>
      ) : error ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No history recorded yet.</p>
      ) : (
        <ol className="mt-4 space-y-4">
          {events.map((event) => (
            <li key={event.id} className="rounded-md border border-gray-100 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-gray-900">
                  {EVENT_LABELS[event.eventType]}
                </span>
                <span className="text-xs text-gray-500">{formatEventDate(event.createdAt)}</span>
              </div>

              {event.comment ? (
                <p className="mt-2 text-sm text-gray-700">
                  <span className="font-medium text-gray-800">Comment:</span> {event.comment}
                </p>
              ) : null}

              {event.changedFields && Object.keys(event.changedFields).length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {Object.entries(event.changedFields).map(([field, change]) => (
                    <li key={field} className="text-sm text-gray-700">
                      <span className="font-medium text-gray-900">
                        {formatPropertyFieldLabel(field)}:
                      </span>{" "}
                      <span className="text-gray-600">{formatPropertyFieldValue(field, change.from)}</span>
                      {" → "}
                      <span className="text-gray-900">{formatPropertyFieldValue(field, change.to)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
