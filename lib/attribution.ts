export type RequestAttribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  landingPage?: string;
  conversionPage?: string;
};

export function normalizeRequestAttribution(raw: unknown): RequestAttribution | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const out: RequestAttribution = {};

  for (const [from, to] of [
    ["source", "source"],
    ["medium", "medium"],
    ["campaign", "campaign"],
    ["term", "term"],
    ["content", "content"],
    ["referrer", "referrer"],
    ["landingPage", "landingPage"],
    ["conversionPage", "conversionPage"],
  ] as const) {
    const value = obj[from];
    if (typeof value === "string" && value.trim()) {
      out[to] = value.trim();
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export function formatAttributionSummary(attr?: RequestAttribution): string | null {
  if (!attr) return null;
  const traffic = [attr.source, attr.medium].filter(Boolean).join(" / ");
  const parts: string[] = [];
  if (traffic) parts.push(traffic);
  if (attr.campaign) parts.push(`campaign: ${attr.campaign}`);
  if (attr.term) parts.push(`keyword: ${attr.term}`);
  if (attr.landingPage) parts.push(`landing: ${attr.landingPage}`);
  if (attr.conversionPage) parts.push(`converted on: ${attr.conversionPage}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}
