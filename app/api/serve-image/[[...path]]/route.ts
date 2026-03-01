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

// Cache the Blob store base URL (e.g. https://xxx.public.blob.vercel-storage.com)
let cachedBlobBaseUrl: string | null = null;

async function getBlobBaseUrl(): Promise<string | null> {
  if (cachedBlobBaseUrl) return cachedBlobBaseUrl;
  try {
    const { blobs } = await list({ prefix: "properties/", limit: 1 });
    const first = blobs?.[0];
    if (!first?.url) return null;
    const match = first.url.match(/^(https:\/\/[^/]+)/);
    cachedBlobBaseUrl = match ? match[1] : null;
  } catch {
    cachedBlobBaseUrl = null;
  }
  return cachedBlobBaseUrl;
}

/**
 * Serves property images from Vercel Blob (production) or from public/uploads (development).
 * Rewrite: /uploads/properties/* -> /api/serve-image/properties/*
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path: pathSegments } = await context.params;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  let blobPath = pathSegments.join("/");
  const q = blobPath.indexOf("?");
  if (q !== -1) blobPath = blobPath.slice(0, q);
  const filename = pathSegments[pathSegments.length - 1] ?? "";
  const baseFilename = filename.includes("?") ? filename.slice(0, filename.indexOf("?")) : filename;
  const ext = baseFilename.split(".").pop()?.toLowerCase() ?? "jpg";
  const contentType = CONTENT_TYPES[ext] ?? "image/jpeg";

  // Production: get store base URL once, then fetch image by path
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const baseUrl = await getBlobBaseUrl();
      if (baseUrl) {
        const imageUrl = `${baseUrl}/${blobPath}`;
        const res = await fetch(imageUrl, { cache: "force-cache" });
        if (res.ok && res.body) {
          return new NextResponse(res.body, {
            headers: {
              "Content-Type": res.headers.get("content-type") ?? contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
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
