import type { Property } from "@/types/property";

function toUtcDayMs(isoDate: string): number | null {
  const m = isoDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return Date.UTC(y, mo - 1, d);
}

function todayUtcDayMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

/**
 * `availableFrom` is only meaningful for future dates.
 * Once date is today/past, treat listing as "available now".
 */
export function normalizeAvailableFrom(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const ms = toUtcDayMs(value);
  if (ms == null) return undefined;
  if (ms <= todayUtcDayMs()) return undefined;
  return value;
}

export function propertyWithNormalizedAvailability<T extends Property>(property: T): T {
  const normalized = normalizeAvailableFrom(property.availableFrom ?? undefined);
  return {
    ...property,
    availableFrom: normalized,
  };
}

