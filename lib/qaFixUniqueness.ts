import { getQaBankItemByTitle } from "@/lib/qaBank";
import { getSeedQuestions } from "@/data/qa/seed";
import { slugifyQaTitle } from "@/lib/qaHub";
import {
  isGenericQaBody,
  normalizeQaBody,
} from "@/lib/qaUniqueContent";
import { pickVirtualAuthor } from "@/lib/qaBank";
import type { QaQuestion } from "@/types/qa";

export type QaUniquenessFix = {
  questionId: string;
  title: string;
  body?: string;
  authorDisplayName?: string;
  reasons: string[];
};

function bodyFromSources(question: QaQuestion): string | undefined {
  const bank = getQaBankItemByTitle(question.title);
  if (bank?.body?.trim() && !isGenericQaBody(bank.body)) {
    return bank.body.trim();
  }
  const seed = getSeedQuestions().find(
    (q) =>
      q.slug === question.slug ||
      slugifyQaTitle(q.title) === slugifyQaTitle(question.title)
  );
  if (seed?.body?.trim() && !isGenericQaBody(seed.body)) {
    return seed.body.trim();
  }
  return undefined;
}

/**
 * Plan fixes for duplicate/generic bodies and reused author display names.
 * Keeps the earliest question (by createdAt) when deduplicating authors and bodies.
 */
export function planQaUniquenessFixes(questions: QaQuestion[]): QaUniquenessFix[] {
  const sorted = [...questions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const usedAuthors = new Set<string>();
  const usedBodies = new Set<string>();
  const fixes: QaUniquenessFix[] = [];

  for (const q of sorted) {
    const reasons: string[] = [];
    const patch: QaUniquenessFix = {
      questionId: q.id,
      title: q.title,
      reasons,
    };

    let body = q.body?.trim();
    if (!body || isGenericQaBody(body)) {
      const replacement = bodyFromSources(q);
      if (replacement) {
        patch.body = replacement;
        reasons.push("generic or missing body");
        body = replacement;
      }
    }

    const bodyKey = normalizeQaBody(body);
    if (bodyKey && usedBodies.has(bodyKey)) {
      const replacement = bodyFromSources(q);
      if (replacement && normalizeQaBody(replacement) !== bodyKey) {
        patch.body = replacement;
        reasons.push("duplicate body");
        body = replacement;
      }
    }
    if (bodyKey) usedBodies.add(normalizeQaBody(body));

    let author = q.authorDisplayName.trim();
    if (usedAuthors.has(author)) {
      const next = pickVirtualAuthor(usedAuthors, q.slug);
      patch.authorDisplayName = next;
      author = next;
      reasons.push("duplicate author name");
    }
    usedAuthors.add(author);

    if (reasons.length > 0) fixes.push(patch);
  }

  return fixes;
}

export function applyQaUniquenessFixes(
  questions: QaQuestion[],
  fixes: QaUniquenessFix[]
): QaQuestion[] {
  const byId = new Map(fixes.map((f) => [f.questionId, f]));
  return questions.map((q) => {
    const fix = byId.get(q.id);
    if (!fix) return q;
    return {
      ...q,
      ...(fix.body !== undefined ? { body: fix.body } : {}),
      ...(fix.authorDisplayName !== undefined
        ? { authorDisplayName: fix.authorDisplayName }
        : {}),
      updatedAt: new Date().toISOString(),
    };
  });
}
