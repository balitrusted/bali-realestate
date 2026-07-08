import { QA_QUESTION_BANK } from "@/data/qa/questionBank";
import { VIRTUAL_AUTHOR_NAMES } from "@/data/qa/virtualAuthors";
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

export function pickVirtualAuthor(avoid: Set<string> = new Set()): string {
  const pool = VIRTUAL_AUTHOR_NAMES.filter((name) => !avoid.has(name));
  const names = pool.length > 0 ? pool : VIRTUAL_AUTHOR_NAMES;
  return names[Math.floor(Math.random() * names.length)];
}

export function defaultBodyForBankItem(item: QaBankItem): string | undefined {
  if (item.body?.trim()) return item.body.trim();
  const hooks = [
    "Anyone dealt with this around Ubud lately?",
    "Trying to plan ahead and not sure what's realistic.",
    "Would love to hear what others did in a similar situation.",
    "Google gives mixed answers so asking here.",
  ];
  const hook = hooks[Math.abs(hashString(item.bankKey)) % hooks.length];
  return hook;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
