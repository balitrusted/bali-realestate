import { QA_QUESTION_BANK } from "@/data/qa/questionBank";
import { VIRTUAL_AUTHOR_NAMES } from "@/data/qa/virtualAuthors";
import { isGenericQaBody } from "@/lib/qaUniqueContent";
import { slugifyQaTitle } from "@/lib/qaHub";
import type { QaCategory } from "@/types/qa";

export const QA_WEEKLY_PUBLISH_QUOTA = 2;

export type QaBankItem = {
  bankKey: string;
  title: string;
  body?: string;
  category: QaCategory;
};

export function getQaBankItems(): QaBankItem[] {
  return QA_QUESTION_BANK.map((item) => ({
    bankKey: slugifyQaTitle(item.title),
    title: item.title,
    body: item.body,
    category: item.category,
  }));
}

export function getQaBankItem(bankKey: string): QaBankItem | null {
  return getQaBankItems().find((item) => item.bankKey === bankKey) ?? null;
}

export function getQaBankItemByTitle(title: string): QaBankItem | null {
  const key = slugifyQaTitle(title);
  return getQaBankItem(key);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** Collect display names already used by questions (all statuses). */
export function collectUsedAuthorNames(
  authorNames: Iterable<string>
): Set<string> {
  const used = new Set<string>();
  for (const name of authorNames) {
    const trimmed = name.trim();
    if (trimmed) used.add(trimmed);
  }
  return used;
}

/**
 * Pick a virtual author not in `avoid`. Uses bankKey for stable preview when provided.
 * Falls back to a generated unique name if the pool is exhausted.
 */
export function pickVirtualAuthor(
  avoid: Set<string> = new Set(),
  bankKey?: string
): string {
  const pool = VIRTUAL_AUTHOR_NAMES.filter((name) => !avoid.has(name));
  if (pool.length === 0) {
    const suffix = Math.abs(hashString(`${bankKey ?? ""}-${Date.now()}`))
      .toString(36)
      .slice(0, 6);
    return `ubud_guest_${suffix}`;
  }
  if (bankKey) {
    const idx = Math.abs(hashString(bankKey)) % pool.length;
    return pool[idx];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function defaultBodyForBankItem(item: QaBankItem): string | undefined {
  const body = item.body?.trim();
  if (body && !isGenericQaBody(body)) return body;
  return undefined;
}
