import type { Property } from "@/types/property";
import { normalizePropertyFeatures } from "@/lib/featureState";

export type PropertyFieldChange = {
  from: unknown;
  to: unknown;
};

const TRACKED_TOP_LEVEL_FIELDS = [
  "title",
  "villaNumber",
  "internalName",
  "description",
  "types",
  "mainArea",
  "subArea",
  "exactLocation",
  "displayLocation",
  "youtubeVideoUrl",
  "bedrooms",
  "floors",
  "bathrooms",
  "duration",
  "features",
  "images",
  "order",
  "availableFrom",
] as const;

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  villaNumber: "Villa number",
  internalName: "Internal name",
  description: "Description",
  types: "Listing types",
  mainArea: "Main area",
  subArea: "Sub-area",
  exactLocation: "Exact location link",
  displayLocation: "Map coordinates",
  youtubeVideoUrl: "YouTube video",
  bedrooms: "Bedrooms",
  floors: "Floors",
  bathrooms: "Bathrooms",
  "price.currency": "Price currency",
  "price.min": "Price (legacy min)",
  "price.monthly": "Monthly rent",
  "price.yearly": "Yearly rent",
  "price.forSale": "Sale price",
  price: "Price",
  duration: "Lease duration",
  features: "Features",
  images: "Images",
  order: "Sort order",
  availableFrom: "Available from",
};

function stableValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === "object") {
    return JSON.parse(JSON.stringify(value));
  }
  return value;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(stableValue(a)) === JSON.stringify(stableValue(b));
}

function formatMoney(amount: unknown, currency?: unknown): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  const cur = typeof currency === "string" ? currency : "IDR";
  if (cur === "IDR") return `${(amount / 1_000_000).toFixed(amount >= 1_000_000 ? 0 : 2)}M IDR`;
  return `${cur} ${amount.toLocaleString("en-US")}`;
}

export function formatPropertyFieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

export function formatPropertyFieldValue(field: string, value: unknown): string {
  if (value == null || value === "") return "—";

  if (field === "types" && Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "—";
  }

  if (field === "images" && Array.isArray(value)) {
    return value.length === 1 ? "1 image" : `${value.length} images`;
  }

  if (field === "features" && value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, state]) => state != null && state !== "unknown")
      .map(([key, state]) => `${key}: ${String(state)}`);
    return entries.length > 0 ? entries.join("; ") : "—";
  }

  if (field.startsWith("price.")) {
    const priceKey = field.slice("price.".length);
    if (priceKey === "currency") return String(value);
    return formatMoney(value, "IDR");
  }

  if (field === "price" && value && typeof value === "object") {
    const price = value as Property["price"];
    const parts: string[] = [];
    if (price.monthly != null) parts.push(`${formatMoney(price.monthly, price.currency)} / month`);
    if (price.yearly != null) parts.push(`${formatMoney(price.yearly, price.currency)} / year`);
    if (price.forSale != null) parts.push(`${formatMoney(price.forSale, price.currency)} for sale`);
    if (parts.length === 0 && price.min != null) {
      parts.push(formatMoney(price.min, price.currency));
    }
    return parts.length > 0 ? parts.join(" · ") : "—";
  }

  if (field === "duration" && value && typeof value === "object") {
    const duration = value as NonNullable<Property["duration"]>;
    return duration.max != null
      ? `${duration.min}–${duration.max} months`
      : `${duration.min} months`;
  }

  if (field === "availableFrom") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

const PRICE_SUBFIELDS = ["currency", "min", "monthly", "yearly", "forSale"] as const;

function diffPriceFields(before: Property, after: Property): Record<string, PropertyFieldChange> {
  const changes: Record<string, PropertyFieldChange> = {};
  for (const key of PRICE_SUBFIELDS) {
    const fromValue = before.price?.[key];
    const toValue = after.price?.[key];
    if (!valuesEqual(fromValue, toValue)) {
      changes[`price.${key}`] = {
        from: stableValue(fromValue),
        to: stableValue(toValue),
      };
    }
  }
  return changes;
}

export function isPriceHistoryField(field: string): boolean {
  return field === "price" || field.startsWith("price.");
}

export function diffPropertyFields(
  before: Property,
  after: Property
): Record<string, PropertyFieldChange> {
  const changes: Record<string, PropertyFieldChange> = {};

  for (const field of TRACKED_TOP_LEVEL_FIELDS) {
    let fromValue: unknown = before[field as keyof Property];
    let toValue: unknown = after[field as keyof Property];

    if (field === "features") {
      fromValue = normalizePropertyFeatures(before.features);
      toValue = normalizePropertyFeatures(after.features);
    }

    if (!valuesEqual(fromValue, toValue)) {
      changes[field] = {
        from: stableValue(fromValue),
        to: stableValue(toValue),
      };
    }
  }

  Object.assign(changes, diffPriceFields(before, after));

  return changes;
}
