import { NextRequest, NextResponse } from "next/server";
import { addSearchQueryLog, type SearchLogSource } from "@/lib/searchQueryLogs";

export const dynamic = "force-dynamic";

const ALLOWED_SOURCES = new Set<SearchLogSource>([
  "site_search_submit",
  "site_search_suggestion_click",
  "search_page_view",
]);

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = (await req.json().catch(() => ({}))) as {
      query?: string;
      source?: SearchLogSource;
      path?: string;
      propertyId?: string;
    };

    const query = (body.query || "").trim();
    const source = body.source;
    if (!query || !source || !ALLOWED_SOURCES.has(source)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    await addSearchQueryLog({
      query,
      source,
      path: typeof body.path === "string" ? body.path : undefined,
      propertyId: typeof body.propertyId === "string" ? body.propertyId : undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    if (process.env.DATA_MIGRATION_OBSERVABILITY === "1") {
      console.info("[search_query_logs] api_track_ok", {
        elapsedMs: Date.now() - startedAt,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Search track error:", error);
    if (process.env.DATA_MIGRATION_OBSERVABILITY === "1") {
      console.error("[search_query_logs] api_track_error", {
        elapsedMs: Date.now() - startedAt,
      });
    }
    return NextResponse.json({ ok: false, error: "Track failed" }, { status: 500 });
  }
}
