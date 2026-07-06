import { NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/qaPersistence";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");
    const limit = Math.min(30, Math.max(1, Number(limitRaw) || 12));
    const items = await getRecentActivity(limit);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/qa/recent]", error);
    return NextResponse.json({ items: [] });
  }
}
