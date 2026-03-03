import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { put } from "@vercel/blob";
import type { PropertyType } from "@/types/property";
import { getPropertyImageSlug } from "@/lib/imageSeo";

// Check authentication
async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
    }

    const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/i, "") || "jpg";

    // Optional: SEO filename from property context (from property edit form)
    const villaNumber = formData.get("villaNumber") as string | null;
    const bedrooms = formData.get("bedrooms");
    const mainArea = formData.get("mainArea") as string | null;
    const subArea = formData.get("subArea") as string | null;
    const typesStr = formData.get("types") as string | null;
    const imageIndexStr = formData.get("imageIndex") as string | null;

    // Determine filename
    let filename: string;
    if (
      villaNumber != null &&
      mainArea != null &&
      imageIndexStr != null &&
      imageIndexStr !== ""
    ) {
      const propertyContext = {
        villaNumber: villaNumber?.trim() || undefined,
        bedrooms: bedrooms != null ? Number(bedrooms) : 1,
        mainArea: (mainArea?.trim() || "ubud") as "ubud" | "canggu" | "sanur" | "seminyak" | "tanah_lot",
        subArea: (subArea?.trim() || undefined) as
          | "gentong"
          | "kedewatan"
          | "keliki"
          | "kemenuh"
          | "lodtunduh"
          | "penestanan"
          | "petulu"
          | "sayan"
          | "sukawati"
          | "tegallalang"
          | undefined,
        types: (() => {
          try {
            if (typesStr) return JSON.parse(typesStr) as PropertyType[];
          } catch {
            /* ignore */
          }
          return ["rent"] as PropertyType[];
        })(),
      };
      const imageIndex = parseInt(imageIndexStr, 10) || 0;
      const slug = getPropertyImageSlug(propertyContext, imageIndex);
      filename = `${slug}.${extension}`;
    } else {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      filename = `${timestamp}-${randomStr}.${extension}`;
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Use Vercel Blob in production, local filesystem in development
    const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

    let publicUrl: string;
    if (useBlob) {
      // Upload to Vercel Blob Storage (addRandomSuffix: false for predictable URLs)
      const blob = await put(`properties/${filename}`, buffer, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      });
      publicUrl = blob.url;
    } else {
      // Local filesystem (development only; on Vercel we use Blob above)
      const uploadsDir = join(process.cwd(), "public", "uploads", "properties");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }
      let filepath = join(uploadsDir, filename);
      if (existsSync(filepath)) {
        const suffix = Date.now().toString(36).slice(-4);
        filename = filename.replace(`.${extension}`, `-${suffix}.${extension}`);
        filepath = join(uploadsDir, filename);
      }
      await writeFile(filepath, buffer);
      publicUrl = `/uploads/properties/${filename}`;
    }

    return NextResponse.json({ url: publicUrl, filename });
  } catch (error) {
    console.error("Error uploading file:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
