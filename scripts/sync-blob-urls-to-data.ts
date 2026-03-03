/**
 * One-time: list all blobs in properties/, build map filename -> blob URL,
 * then replace /uploads/properties/XXX in data/properties.ts with the real URLs.
 * Run: npx tsx scripts/sync-blob-urls-to-data.ts
 * Requires BLOB_READ_WRITE_TOKEN in .env.local (same as upload script).
 */

import { list } from "@vercel/blob";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync, readFileSync } from "fs";

const DATA_FILE = join(process.cwd(), "data", "properties.ts");
const ARTICLES_FILE = join(process.cwd(), "data", "articles.ts");
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

// From blob pathname "properties/villa-xxx-ABC123.jpg" get key "villa-xxx.jpg" (strip random suffix)
function canonicalFilename(pathname: string): string {
  const filename = pathname.replace(/^properties\//, "");
  return filename.replace(/-[a-zA-Z0-9]{10,}\.(jpe?g|png|gif|webp)$/i, (_, ext) => `.${ext}`);
}

async function main() {
  console.log("Loading .env.local...");
  loadEnvLocal();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Set BLOB_READ_WRITE_TOKEN in .env.local");
    process.exit(1);
  }

  console.log("Listing blobs with prefix properties/...");
  const pathnameToUrl: Record<string, string> = {};
  let cursor: string | undefined;
  do {
    const result = await list({ prefix: "properties/", limit: 500, cursor });
    for (const b of result.blobs) {
      const pathname = b.pathname.startsWith("properties/") ? b.pathname : `properties/${b.pathname}`;
      const filename = pathname.replace(/^properties\//, "");
      pathnameToUrl[pathname] = b.url;
      pathnameToUrl[filename] = b.url;
      const canon = canonicalFilename(pathname);
      if (canon !== filename) pathnameToUrl[canon] = b.url;
    }
    cursor = result.hasMore ? result.cursor : undefined;
    console.log("  Listed", result.blobs.length, "blobs, total keys:", Object.keys(pathnameToUrl).length);
  } while (cursor);

  const blobUrlsByPrefix = Object.entries(pathnameToUrl);

  function resolveUrl(path: string): string | null {
    const filename = path.replace(/^\/uploads\/properties\//, "");
    const exact = pathnameToUrl[filename] ?? pathnameToUrl[filename.toLowerCase()];
    if (exact) return exact;
    const base = filename.replace(/\.[^.]+$/, "");
    const byPrefix = blobUrlsByPrefix.find(([k]) => k.startsWith(base) || k.toLowerCase().startsWith(base.toLowerCase()));
    return byPrefix ? byPrefix[1] : null;
  }

  let totalReplaced = 0;

  const dataContent = await readFile(DATA_FILE, "utf-8");
  const pathRegex = /"(\/uploads\/properties\/[^"]+)"/g;
  const newDataContent = dataContent.replace(pathRegex, (match, path) => {
    const url = resolveUrl(path);
    if (url) {
      totalReplaced++;
      return `"${url}"`;
    }
    return match;
  });
  if (totalReplaced > 0) await writeFile(DATA_FILE, newDataContent);
  console.log("Replaced", totalReplaced, "paths in data/properties.ts");

  if (existsSync(ARTICLES_FILE)) {
    const articlesContent = await readFile(ARTICLES_FILE, "utf-8");
    let articleReplaced = 0;
    let newArticlesContent = articlesContent;
    for (const re of [
      /src=\\"(\/uploads\/properties\/[^"\\]+)\\"/g,
      /src="(\/uploads\/properties\/[^"]+)"/g,
    ]) {
      newArticlesContent = newArticlesContent.replace(re, (match, path) => {
        const url = resolveUrl(path);
        if (url) {
          articleReplaced++;
          return match.startsWith('src=\\"') ? `src=\\"${url}\\"` : `src="${url}"`;
        }
        return match;
      });
    }
    if (articleReplaced > 0) {
      await writeFile(ARTICLES_FILE, newArticlesContent);
      console.log("Replaced", articleReplaced, "image paths in data/articles.ts");
      totalReplaced += articleReplaced;
    } else {
      const hasUploadPath = /\/uploads\/properties\//.test(articlesContent);
      if (hasUploadPath) console.log("Article image path found but no matching blob (upload image via admin to Blob?).");
    }
  }

  console.log("Done. Total replaced:", totalReplaced);
  console.log("Commit and push, then redeploy. Images will load directly from Blob.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
