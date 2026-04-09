import type { GlossaryTerm } from "@/types/glossary";

/** Regenerates `data/glossary/index.ts` for local admin saves (no Blob token). */
export function generateGlossaryIndexFile(terms: GlossaryTerm[]): string {
  const ind = "  ";
  let c = `import type { GlossaryTerm } from "@/types/glossary";\n\n`;
  c += `// Glossary terms for /glossary. Edited via /admin/glossary or this file.\n`;
  c += `// On Vercel, runtime may merge newer rows from Blob (see lib/glossaryPostsPersistence.ts).\n`;
  c += `export const glossaryTerms: GlossaryTerm[] = [\n`;
  terms.forEach((t, i) => {
    c += `${ind}{\n`;
    c += `${ind}${ind}id: ${JSON.stringify(t.id)},\n`;
    c += `${ind}${ind}slug: ${JSON.stringify(t.slug)},\n`;
    c += `${ind}${ind}title: ${JSON.stringify(t.title)},\n`;
    c += `${ind}${ind}category: ${JSON.stringify(t.category)},\n`;
    c += `${ind}${ind}summary: ${JSON.stringify(t.summary)},\n`;
    c += `${ind}${ind}content: ${JSON.stringify(t.content)},\n`;
    c += `${ind}${ind}published: ${t.published},\n`;
    c += `${ind}${ind}createdAt: ${JSON.stringify(t.createdAt)},\n`;
    c += `${ind}${ind}updatedAt: ${JSON.stringify(t.updatedAt)},\n`;
    if (t.seoTitle) c += `${ind}${ind}seoTitle: ${JSON.stringify(t.seoTitle)},\n`;
    if (t.seoDescription) c += `${ind}${ind}seoDescription: ${JSON.stringify(t.seoDescription)},\n`;
    if (t.relatedGuideUrl) c += `${ind}${ind}relatedGuideUrl: ${JSON.stringify(t.relatedGuideUrl)},\n`;
    if (t.relatedBlogUrl) c += `${ind}${ind}relatedBlogUrl: ${JSON.stringify(t.relatedBlogUrl)},\n`;
    c += `${ind}}${i < terms.length - 1 ? "," : ""}\n`;
  });
  c += `];\n`;
  return c;
}
