import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * Serves property images from Vercel Blob (production) or from public/uploads (development).
 * Rewrite: /uploads/properties/* -> /api/serve-image/properties/*
 * In v0.25 there is no get(); we use list(prefix) and redirect to the blob's public URL.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path: pathSegments } = await context.params;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  // Join path and strip query (Image Optimizer may add ?w=800&q=75)
  let blobPath = pathSegments.join("/");
  const q = blobPath.indexOf("?");
  if (q !== -1) blobPath = blobPath.slice(0, q);
  const filename = pathSegments[pathSegments.length - 1] ?? "";
  const baseFilename = filename.includes("?") ? filename.slice(0, filename.indexOf("?")) : filename;
  const ext = baseFilename.split(".").pop()?.toLowerCase() ?? "jpg";
  const contentType = CONTENT_TYPES[ext] ?? "image/jpeg";

  // Production: find blob by pathname, fetch it and stream the body (200 OK).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({ prefix: blobPath, limit: 5 });
      // Match by pathname (exact or normalized); fallback to first blob when prefix is exact
      const match =
        blobs?.find(
          (b) =>
            b.pathname === blobPath ||
            b.pathname === `/${blobPath}` ||
            b.pathname.endsWith(baseFilename)
        ) ?? blobs?.[0];
      if (match?.url) {
        const res = await fetch(match.url, { cache: "force-cache" });
        if (!res.ok) return new NextResponse(null, { status: 404 });
        const body = res.body;
        if (!body) return new NextResponse(null, { status: 404 });
        return new NextResponse(body, {
          headers: {
            "Content-Type": res.headers.get("content-type") ?? contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    } catch {
      // Fall through to local or 404
    }
  }

  // Development: serve from public/uploads if file exists
  const localPath = join(process.cwd(), "public", "uploads", blobPath);
  if (existsSync(localPath)) {
    try {
      const buffer = await readFile(localPath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch {
      // fall through to 404
    }
  }

  return new NextResponse(null, { status: 404 });
}
