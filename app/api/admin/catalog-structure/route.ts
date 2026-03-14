import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  loadCatalogStructure,
  saveCatalogStructure,
  type CatalogStructure,
} from "@/lib/catalogStructure";

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const structure = await loadCatalogStructure();
    return NextResponse.json(structure);
  } catch (e) {
    console.error("Catalog structure GET:", e);
    return NextResponse.json({ error: "Failed to load structure" }, { status: 500 });
  }
}

type AddBody =
  | { kind: "type"; slug: string; labelEn: string }
  | { kind: "area"; slug: string; nameEn: string }
  | { kind: "segment"; category: keyof CatalogStructure["segmentCategories"]; slug: string };

function slugSafe(s: string): boolean {
  return /^[a-z0-9-]+$/.test(s) && s.length >= 1;
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as AddBody;
    if (!body.kind) {
      return NextResponse.json({ error: "kind is required" }, { status: 400 });
    }
    const structure = await loadCatalogStructure();

    if (body.kind === "type") {
      const slug = (body.slug ?? "").trim().toLowerCase();
      const labelEn = (body.labelEn ?? "").trim();
      if (!slug || !slugSafe(slug)) {
        return NextResponse.json({ error: "Invalid type slug (use lowercase letters, numbers, hyphens)" }, { status: 400 });
      }
      if (structure.types.some((t) => t.slug === slug)) {
        return NextResponse.json({ error: "Type with this slug already exists" }, { status: 400 });
      }
      structure.types.push({ slug, labelEn: labelEn || slug });
    } else if (body.kind === "area") {
      const slug = (body.slug ?? "").trim().toLowerCase();
      const nameEn = (body.nameEn ?? "").trim();
      if (!slug || !slugSafe(slug)) {
        return NextResponse.json({ error: "Invalid area slug" }, { status: 400 });
      }
      if (structure.areas.some((a) => a.slug === slug)) {
        return NextResponse.json({ error: "Area with this slug already exists" }, { status: 400 });
      }
      structure.areas.push({ slug, nameEn: nameEn || slug });
    } else if (body.kind === "segment") {
      const category = body.category;
      const slug = (body.slug ?? "").trim().toLowerCase();
      if (
        !category ||
        !["subArea", "bedroom", "payment", "amenity"].includes(category) ||
        !slug ||
        !slugSafe(slug)
      ) {
        return NextResponse.json({ error: "Invalid segment category or slug" }, { status: 400 });
      }
      const arr = structure.segmentCategories[category];
      if (arr.includes(slug)) {
        return NextResponse.json({ error: "This segment slug already exists in the category" }, { status: 400 });
      }
      arr.push(slug);
    } else {
      return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
    }

    await saveCatalogStructure(structure);
    return NextResponse.json(structure);
  } catch (e) {
    console.error("Catalog structure POST:", e);
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}

type DeleteBody =
  | { kind: "type"; slug: string }
  | { kind: "area"; slug: string }
  | { kind: "segment"; category: keyof CatalogStructure["segmentCategories"]; slug: string };

export async function DELETE(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as DeleteBody;
    if (!body.kind) {
      return NextResponse.json({ error: "kind is required" }, { status: 400 });
    }
    const structure = await loadCatalogStructure();

    if (body.kind === "type") {
      const slug = (body.slug ?? "").trim();
      const idx = structure.types.findIndex((t) => t.slug === slug);
      if (idx === -1) {
        return NextResponse.json({ error: "Type not found" }, { status: 404 });
      }
      structure.types.splice(idx, 1);
    } else if (body.kind === "area") {
      const slug = (body.slug ?? "").trim();
      const idx = structure.areas.findIndex((a) => a.slug === slug);
      if (idx === -1) {
        return NextResponse.json({ error: "Area not found" }, { status: 404 });
      }
      structure.areas.splice(idx, 1);
    } else if (body.kind === "segment") {
      const category = body.category;
      const slug = (body.slug ?? "").trim();
      if (!category || !["subArea", "bedroom", "payment", "amenity"].includes(category)) {
        return NextResponse.json({ error: "Invalid segment category" }, { status: 400 });
      }
      const arr = structure.segmentCategories[category];
      const idx = arr.indexOf(slug);
      if (idx === -1) {
        return NextResponse.json({ error: "Segment not found" }, { status: 404 });
      }
      arr.splice(idx, 1);
    } else {
      return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
    }

    await saveCatalogStructure(structure);
    return NextResponse.json(structure);
  } catch (e) {
    console.error("Catalog structure DELETE:", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
