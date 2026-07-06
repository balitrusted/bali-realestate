import type { QaCategory } from "@/types/qa";

export const QA_CATEGORY_ORDER: QaCategory[] = ["rent", "buy", "services", "living"];

export const QA_RESERVED_SLUGS = new Set<string>([...QA_CATEGORY_ORDER]);

export function qaCategoryLabel(c: QaCategory): string {
  const labels: Record<QaCategory, string> = {
    rent: "Rent",
    buy: "Buy",
    services: "Services",
    living: "Living in Bali",
  };
  return labels[c];
}

export function qaCategoryDescription(c: QaCategory): string {
  const descriptions: Record<QaCategory, string> = {
    rent: "Long-term villa rentals, areas, budgets, and lease basics in Ubud and beyond.",
    buy: "Ownership structures, land, due diligence, and investment questions.",
    services: "Villa checks, relocation help, and paid support from Balitrusted.",
    living: "Visas, money, daily life, and practical expat topics.",
  };
  return descriptions[c];
}

export function slugifyQaTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
