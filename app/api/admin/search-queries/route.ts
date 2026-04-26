import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSearchQueryLogs } from "@/lib/searchQueryLogs";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

export async function GET() {
  const startedAt = Date.now();
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await getSearchQueryLogs();
  const recent = [...rows].reverse().slice(0, 1000);
  if (process.env.DATA_MIGRATION_OBSERVABILITY === "1") {
    console.info("[search_query_logs] api_admin_read_ok", {
      rows: rows.length,
      returnedRows: recent.length,
      elapsedMs: Date.now() - startedAt,
    });
  }
  return NextResponse.json({ rows: recent });
}
