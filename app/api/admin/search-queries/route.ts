import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSearchQueryLogs } from "@/lib/searchQueryLogs";

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await getSearchQueryLogs();
  const recent = [...rows].reverse().slice(0, 1000);
  return NextResponse.json({ rows: recent });
}
