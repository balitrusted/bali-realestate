import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
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
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path: pathSegments } = await context.params;
  if (!pathSegments?.length) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  const blobPath = pathSegments.join("/");
  const filename = pathSegments[pathSegments.length - 1] ?? "";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const contentType = CONTENT_TYPES[ext] ?? "image/jpeg";

  // Production: try Vercel Blob first
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const result = await get(blobPath, { access: "public" });
      if (result?.statusCode === 200 && result.stream) {
        return new NextResponse(result.stream, {
          headers: {
            "Content-Type": result.blob?.contentType ?? contentType,
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
