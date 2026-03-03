/**
 * One-time script: upload all property images from public/uploads/properties to Vercel Blob.
 * Run from project root with BLOB_READ_WRITE_TOKEN in .env.local or environment:
 *   npx tsx scripts/upload-images-to-blob.ts
 */

import { put } from "@vercel/blob";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

const DATA_FILE = join(process.cwd(), "data", "properties.ts");
const UPLOADS_DIR = join(process.cwd(), "public", "uploads", "properties");
const ENV_LOCAL = join(process.cwd(), ".env.local");

function loadEnvLocal() {
  if (!existsSync(ENV_LOCAL)) return;
  const content = readFileSync(ENV_LOCAL, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
        if (key && !process.env[key]) process.env[key] = val;
      }
    }
  }
}

async function main() {
  console.log("Starting upload script...");
  loadEnvLocal();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN not set. Add it to .env.local or set in environment.");
    process.exit(1);
  }
  console.log("Token found. Reading data/properties.ts...");

  const content = await readFile(DATA_FILE, "utf-8");
  const pathRegex = /\/uploads\/properties\/([^"'\s]+)/g;
  const paths = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = pathRegex.exec(content)) !== null) {
    paths.add(m[1]);
  }

  console.log("Image paths in data:", paths.size);

  if (paths.size === 0) {
    console.log("No /uploads/properties/ image paths found in data.");
    process.exit(0);
  }

  if (!existsSync(UPLOADS_DIR)) {
    console.error("Directory not found: public/uploads/properties");
    console.error("Put your property image files there, then run this script.");
    process.exit(1);
  }

  const files = await readdir(UPLOADS_DIR);
  const toUpload = [...paths].filter((p) => files.includes(p));
  const missing = [...paths].filter((p) => !files.includes(p));
  if (missing.length > 0) {
    console.warn("Missing in public/uploads/properties:", missing.length, "files");
    missing.slice(0, 5).forEach((f) => console.warn("  -", f));
    if (missing.length > 5) console.warn("  ...");
  }

  console.log("Files to upload:", toUpload.length);
  if (toUpload.length === 0) {
    console.log("No files to upload. Add images to public/uploads/properties and run again.");
    process.exit(0);
  }

  let ok = 0;
  let err = 0;
  const total = toUpload.length;
  for (let i = 0; i < toUpload.length; i++) {
    const filename = toUpload[i];
    const filepath = join(UPLOADS_DIR, filename);
    try {
      const buffer = await readFile(filepath);
      const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
      const contentType =
        { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" }[
          ext
        ] ?? "image/jpeg";
      await put(`properties/${filename}`, buffer, { access: "public", contentType, addRandomSuffix: false });
      ok++;
      console.log(`[${i + 1}/${total}] ${filename}`);
    } catch (e) {
      console.error("Failed:", filename, e);
      err++;
    }
  }

  console.log("Done. Uploaded:", ok, "Failed:", err);
}

main();
