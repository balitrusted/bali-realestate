import type { GlossaryCategory } from "@/types/glossary";

export function glossaryIndexLetter(title: string): string {
  const c = title.trim().charAt(0).toUpperCase();
  if (c >= "A" && c <= "Z") return c;
  return "#";
}

export const GLOSSARY_CATEGORY_ORDER: GlossaryCategory[] = [
  "legal",
  "documents",
  "living",
  "finance",
  "other",
];

export function glossaryCategoryLabel(c: GlossaryCategory): string {
  const labels: Record<GlossaryCategory, string> = {
    legal: "Legal & ownership",
    documents: "Documents & visas",
    living: "Daily life",
    finance: "Money & fees",
    other: "General",
  };
  return labels[c];
}
