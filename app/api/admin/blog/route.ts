import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { writeFile } from "fs/promises";
import { join } from "path";
import type { BlogPost } from "@/types/blog";
import { getAllBlogPosts, saveBlogPostsToBlob } from "@/lib/blogPostsPersistence";
import { generateBlogIndexFile } from "@/lib/generateBlogIndexFile";

const DATA_FILE = join(process.cwd(), "data", "blog", "index.ts");

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

async function persistPosts(posts: BlogPost[]) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await saveBlogPostsToBlob(posts);
  } else {
    await writeFile(DATA_FILE, generateBlogIndexFile(posts), "utf-8");
  }
}

function parseLocation(v: string): BlogPost["location"] {
  if (v === "ubud" || v === "sanur" || v === "other") return v;
  return "other";
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** GET — all posts (admin). */
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const posts = await getAllBlogPosts();
    const sorted = [...posts].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    return NextResponse.json({ posts: sorted });
  } catch (error) {
    console.error("admin blog GET:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

/** POST — create. */
export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const existing = await getAllBlogPosts();

    const slugRaw = (body.slug as string)?.trim() || (body.title as string)?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `post-${Date.now()}`;

    if (existing.some((p) => p.slug === slugRaw)) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const published = Boolean(body.published);
    const newPost: BlogPost = {
      id: (body.id as string)?.trim() || `blog-${Date.now()}`,
      slug: slugRaw,
      title: String(body.title || "").trim() || "Untitled",
      summary: String(body.summary || "").trim(),
      introHighlight: body.introHighlight ? String(body.introHighlight).trim() : undefined,
      ctaLabel: body.ctaLabel ? String(body.ctaLabel).trim() : undefined,
      ctaUrl: body.ctaUrl ? String(body.ctaUrl).trim() : undefined,
      content: String(body.content || ""),
      location: parseLocation(String(body.location || "ubud")),
      tags: parseTags(body.tags),
      author: String(body.author || "Balitrusted Team").trim(),
      featuredImage: body.featuredImage ? String(body.featuredImage).trim() : undefined,
      published,
      publishedAt: published ? (body.publishedAt as string) || now : body.publishedAt ? String(body.publishedAt) : now,
      createdAt: (body.createdAt as string) || now,
      updatedAt: now,
      seoTitle: body.seoTitle ? String(body.seoTitle).trim() : undefined,
      seoDescription: body.seoDescription ? String(body.seoDescription).trim() : undefined,
      ogTitle: body.ogTitle ? String(body.ogTitle).trim() : undefined,
      ogDescription: body.ogDescription ? String(body.ogDescription).trim() : undefined,
      canonicalUrl: body.canonicalUrl ? String(body.canonicalUrl).trim() : undefined,
    };

    const next = [...existing, newPost];
    await persistPosts(next);
    return NextResponse.json({ post: newPost });
  } catch (error) {
    console.error("admin blog POST:", error);
    const message = error instanceof Error ? error.message : "Failed to create";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PUT — update by id. */
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

    const existing = await getAllBlogPosts();
    const index = existing.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const prev = existing[index];
    const slugNext = body.slug != null ? String(body.slug).trim() : prev.slug;
    if (slugNext !== prev.slug && existing.some((p) => p.slug === slugNext && p.id !== id)) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const published = body.published !== undefined ? Boolean(body.published) : prev.published;

    const updated: BlogPost = {
      ...prev,
      slug: slugNext,
      title: body.title != null ? String(body.title).trim() : prev.title,
      summary: body.summary != null ? String(body.summary).trim() : prev.summary,
      introHighlight:
        body.introHighlight !== undefined
          ? body.introHighlight
            ? String(body.introHighlight).trim()
            : undefined
          : prev.introHighlight,
      ctaLabel:
        body.ctaLabel !== undefined
          ? body.ctaLabel
            ? String(body.ctaLabel).trim()
            : undefined
          : prev.ctaLabel,
      ctaUrl:
        body.ctaUrl !== undefined
          ? body.ctaUrl
            ? String(body.ctaUrl).trim()
            : undefined
          : prev.ctaUrl,
      content: body.content != null ? String(body.content) : prev.content,
      location: body.location != null ? parseLocation(String(body.location)) : prev.location,
      tags: body.tags != null ? parseTags(body.tags) : prev.tags,
      author: body.author != null ? String(body.author).trim() : prev.author,
      featuredImage:
        body.featuredImage === "" ? undefined : body.featuredImage != null ? String(body.featuredImage).trim() : prev.featuredImage,
      published,
      publishedAt:
        body.publishedAt != null ? String(body.publishedAt) : published ? prev.publishedAt || now : prev.publishedAt,
      createdAt: prev.createdAt,
      updatedAt: now,
      seoTitle: body.seoTitle !== undefined ? (body.seoTitle ? String(body.seoTitle).trim() : undefined) : prev.seoTitle,
      seoDescription:
        body.seoDescription !== undefined
          ? body.seoDescription
            ? String(body.seoDescription).trim()
            : undefined
          : prev.seoDescription,
      ogTitle: body.ogTitle !== undefined ? (body.ogTitle ? String(body.ogTitle).trim() : undefined) : prev.ogTitle,
      ogDescription:
        body.ogDescription !== undefined
          ? body.ogDescription
            ? String(body.ogDescription).trim()
            : undefined
          : prev.ogDescription,
      canonicalUrl:
        body.canonicalUrl !== undefined
          ? body.canonicalUrl
            ? String(body.canonicalUrl).trim()
            : undefined
          : prev.canonicalUrl,
    };

    const next = [...existing];
    next[index] = updated;
    await persistPosts(next);
    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("admin blog PUT:", error);
    const message = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE — by id. */
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
    const existing = await getAllBlogPosts();
    const filtered = existing.filter((p) => p.id !== id);
    if (filtered.length === existing.length) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    await persistPosts(filtered);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin blog DELETE:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
