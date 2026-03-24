import redirects from "@/data/property-redirects.json";

type RedirectEntry = { fromPath: string; toPath: string };

function normalizePath(p: string): string {
  const t = p.trim();
  if (t.length > 1 && t.endsWith("/")) return t.slice(0, -1);
  return t;
}

const map = new Map<string, string>();
for (const e of (redirects as { entries: RedirectEntry[] }).entries) {
  if (e?.fromPath && e?.toPath) {
    map.set(normalizePath(e.fromPath), normalizePath(e.toPath));
  }
}

/** 301 target path (with leading slash), or null. */
export function getPropertyManualRedirect(pathname: string): string | null {
  return map.get(normalizePath(pathname)) ?? null;
}
