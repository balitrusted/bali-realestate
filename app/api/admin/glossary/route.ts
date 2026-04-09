import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile } from "fs/promises";
import { join } from "path";
import type { GlossaryCategory, GlossaryTerm } from "@/types/glossary";
import { getAllGlossaryTerms, saveGlossaryTermsToBlob } from "@/lib/glossaryPostsPersistence";
import { generateGlossaryIndexFile } from "@/lib/generateGlossaryIndexFile";

const DATA_FILE = join(process.cwd(), "data", "glossary", "index.ts");

const CATEGORIES: GlossaryCategory[] = ["legal", "documents", "living", "finance", "other"];

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

async function persistTerms(terms: GlossaryTerm[]) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await saveGlossaryTermsToBlob(terms);
  } else {
    await writeFile(DATA_FILE, generateGlossaryIndexFile(terms), "utf-8");
  }
}

function parseCategory(raw: unknown): GlossaryCategory {
  const s = String(raw || "").trim();
  if (CATEGORIES.includes(s as GlossaryCategory)) return s as GlossaryCategory;
  return "other";
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const terms = await getAllGlossaryTerms();
    const sorted = [...terms].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return NextResponse.json({ terms: sorted });
  } catch (error) {
    console.error("admin glossary GET:", error);
    return NextResponse.json({ error: "Failed to load terms" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const existing = await getAllGlossaryTerms();

    const slugRaw =
      (body.slug as string)?.trim() ||
      (body.title as string)?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
      `term-${Date.now()}`;

    if (existing.some((t) => t.slug === slugRaw)) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const published = Boolean(body.published);
    const newTerm: GlossaryTerm = {
      id: (body.id as string)?.trim() || `glossary-${Date.now()}`,
      slug: slugRaw,
      title: String(body.title || "").trim() || "Untitled",
      category: parseCategory(body.category),
      summary: String(body.summary || "").trim(),
      content: String(body.content || ""),
      published,
      createdAt: (body.createdAt as string) || now,
      updatedAt: now,
      seoTitle: body.seoTitle ? String(body.seoTitle).trim() : undefined,
      seoDescription: body.seoDescription ? String(body.seoDescription).trim() : undefined,
      relatedGuideUrl: body.relatedGuideUrl ? String(body.relatedGuideUrl).trim() : undefined,
      relatedBlogUrl: body.relatedBlogUrl ? String(body.relatedBlogUrl).trim() : undefined,
    };

    const next = [...existing, newTerm];
    await persistTerms(next);
    return NextResponse.json({ term: newTerm });
  } catch (error) {
    console.error("admin glossary POST:", error);
    const message = error instanceof Error ? error.message : "Failed to create";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown> & { id?: string };
    const id = body.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const existing = await getAllGlossaryTerms();
    const index = existing.findIndex((t) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    const prev = existing[index];
    const slugNext = body.slug != null ? String(body.slug).trim() : prev.slug;
    if (slugNext !== prev.slug && existing.some((t) => t.slug === slugNext && t.id !== id)) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const published = body.published !== undefined ? Boolean(body.published) : prev.published;

    const updated: GlossaryTerm = {
      ...prev,
      slug: slugNext,
      title: body.title != null ? String(body.title).trim() : prev.title,
      category: body.category != null ? parseCategory(body.category) : prev.category,
      summary: body.summary != null ? String(body.summary).trim() : prev.summary,
      content: body.content != null ? String(body.content) : prev.content,
      published,
      createdAt: prev.createdAt,
      updatedAt: now,
      seoTitle:
        body.seoTitle !== undefined ? (body.seoTitle ? String(body.seoTitle).trim() : undefined) : prev.seoTitle,
      seoDescription:
        body.seoDescription !== undefined
          ? body.seoDescription
            ? String(body.seoDescription).trim()
            : undefined
          : prev.seoDescription,
      relatedGuideUrl:
        body.relatedGuideUrl !== undefined
          ? body.relatedGuideUrl
            ? String(body.relatedGuideUrl).trim()
            : undefined
          : prev.relatedGuideUrl,
      relatedBlogUrl:
        body.relatedBlogUrl !== undefined
          ? body.relatedBlogUrl
            ? String(body.relatedBlogUrl).trim()
            : undefined
          : prev.relatedBlogUrl,
    };

    const next = [...existing];
    next[index] = updated;
    await persistTerms(next);
    return NextResponse.json({ term: updated });
  } catch (error) {
    console.error("admin glossary PUT:", error);
    const message = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const existing = await getAllGlossaryTerms();
    const filtered = existing.filter((t) => t.id !== id);
    if (filtered.length === existing.length) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }
    await persistTerms(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin glossary DELETE:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
