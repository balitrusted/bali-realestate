import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminSession } from "@/lib/auth";
import { loadAllPropertiesIncludingArchived } from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { propertiesToSearchHits, rankPropertiesForSearch } from "@/lib/propertySearch";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const limit = Math.min(50, Math.max(1, parseInt(limitRaw || "20", 10) || 20));

  if (!q) {
    return NextResponse.json({ query: "", results: [] });
  }

  const cookieStore = await cookies();
  const isAdmin = isValidAdminSession(cookieStore.get("admin-auth")?.value);
  const all = await loadAllPropertiesIncludingArchived();
  const ranked = rankPropertiesForSearch(all, q, limit, { includeInternalName: isAdmin });
  const slugIdx = buildPropertySlugIndex(all);
  const results = propertiesToSearchHits(ranked, (p) => slugIdx.segmentFor(p), {
    includeInternalName: isAdmin,
  });

  return NextResponse.json({ query: q, results, adminSearch: isAdmin });
}
