import { getAllGlossaryTerms } from "@/lib/glossaryPostsPersistence";
import type { GlossaryTerm } from "@/types/glossary";

export async function getGlossaryTerms(): Promise<GlossaryTerm[]> {
  const all = await getAllGlossaryTerms();
  return all.filter((t) => t.published).sort((a, b) => a.title.localeCompare(b.title));
}

export async function getGlossaryTermBySlug(slug: string): Promise<GlossaryTerm | null> {
  const all = await getAllGlossaryTerms();
  return all.find((t) => t.slug === slug && t.published) ?? null;
}
