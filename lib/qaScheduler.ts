import {
  defaultBodyForBankItem,
  getQaBankItem,
  getQaBankItems,
  pickVirtualAuthor,
  QA_WEEKLY_PUBLISH_QUOTA,
  type QaBankItem,
} from "@/lib/qaBank";
import { getBankQueueEntries, setBankQueueEntry } from "@/lib/qaBankState";
import { slugifyQaTitle } from "@/lib/qaHub";
import { getAllQuestions, getQuestionById, persistQuestion } from "@/lib/qaPersistence";
import type { QaQuestion } from "@/types/qa";

export type QaBankProposal = QaBankItem & {
  suggestedAuthor: string;
  suggestedBody?: string;
};

export type QaScheduleStats = {
  publishedThisWeek: number;
  weeklyQuota: number;
  remainingInBank: number;
  skippedCount: number;
  acceptedCount: number;
  draftsAwaitingAnswer: number;
  quotaReached: boolean;
};

export type QaScheduleOverview = {
  stats: QaScheduleStats;
  proposal: QaBankProposal | null;
};

function startOfIsoWeek(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function isPublishedThisWeek(publishedAt: string | undefined, now = new Date()): boolean {
  if (!publishedAt) return false;
  const at = new Date(publishedAt);
  if (Number.isNaN(at.getTime())) return false;
  return at >= startOfIsoWeek(now);
}

async function uniqueSlug(base: string, taken: Set<string>): Promise<string> {
  let slug = base || `question-${Date.now()}`;
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

async function buildTakenBankKeys(): Promise<{
  skipped: Set<string>;
  accepted: Set<string>;
  acceptedAuthors: Set<string>;
}> {
  const entries = await getBankQueueEntries();
  const skipped = new Set<string>();
  const accepted = new Set<string>();
  const acceptedAuthors = new Set<string>();
  for (const entry of entries) {
    if (entry.status === "skipped") skipped.add(entry.bankKey);
    if (entry.status === "accepted") accepted.add(entry.bankKey);
  }

  const questions = await getAllQuestions();
  const takenSlugs = new Set(questions.map((q) => q.slug));
  for (const item of getQaBankItems()) {
    if (takenSlugs.has(item.bankKey)) accepted.add(item.bankKey);
    const alt = questions.find((q) => slugifyQaTitle(q.title) === item.bankKey);
    if (alt) accepted.add(item.bankKey);
  }

  for (const entry of entries) {
    if (entry.status === "accepted" && entry.questionId) {
      const q = questions.find((x) => x.id === entry.questionId);
      if (q) acceptedAuthors.add(q.authorDisplayName);
    }
  }

  return { skipped, accepted, acceptedAuthors };
}

export async function getScheduleOverview(): Promise<QaScheduleOverview> {
  const [questions, queue] = await Promise.all([getAllQuestions(), getBankQueueEntries()]);
  const { skipped, accepted, acceptedAuthors } = await buildTakenBankKeys();

  const publishedThisWeek = questions.filter(
    (q) => q.status === "published" && isPublishedThisWeek(q.publishedAt)
  ).length;

  const acceptedQuestionIds = new Set(
    queue.filter((e) => e.status === "accepted" && e.questionId).map((e) => e.questionId as string)
  );
  const draftsAwaitingAnswer = questions.filter(
    (q) =>
      q.status === "draft" &&
      acceptedQuestionIds.has(q.id) &&
      q.answerCount === 0
  ).length;

  const remainingInBank = getQaBankItems().filter(
    (item) => !skipped.has(item.bankKey) && !accepted.has(item.bankKey)
  ).length;

  const stats: QaScheduleStats = {
    publishedThisWeek,
    weeklyQuota: QA_WEEKLY_PUBLISH_QUOTA,
    remainingInBank,
    skippedCount: skipped.size,
    acceptedCount: accepted.size,
    draftsAwaitingAnswer,
    quotaReached: publishedThisWeek >= QA_WEEKLY_PUBLISH_QUOTA,
  };

  const nextItem = getQaBankItems().find(
    (item) => !skipped.has(item.bankKey) && !accepted.has(item.bankKey)
  );

  const proposal: QaBankProposal | null = nextItem
    ? {
        ...nextItem,
        suggestedAuthor: pickVirtualAuthor(acceptedAuthors),
        suggestedBody: defaultBodyForBankItem(nextItem),
      }
    : null;

  return { stats, proposal };
}

export async function skipBankProposal(bankKey: string): Promise<QaScheduleOverview> {
  const item = getQaBankItem(bankKey);
  if (!item) throw new Error("Question not found in bank");
  await setBankQueueEntry({
    bankKey,
    status: "skipped",
    updatedAt: new Date().toISOString(),
  });
  return getScheduleOverview();
}

export async function acceptBankProposal(bankKey: string): Promise<{
  question: QaQuestion;
  overview: QaScheduleOverview;
}> {
  const item = getQaBankItem(bankKey);
  if (!item) throw new Error("Question not found in bank");

  const { skipped, accepted, acceptedAuthors } = await buildTakenBankKeys();
  if (skipped.has(bankKey)) throw new Error("This question was skipped");
  if (accepted.has(bankKey)) throw new Error("This question is already in the pipeline");

  const questions = await getAllQuestions();
  const takenSlugs = new Set(questions.map((q) => q.slug));
  const slug = await uniqueSlug(item.bankKey, takenSlugs);
  const now = new Date().toISOString();
  const author = pickVirtualAuthor(acceptedAuthors);
  const body = defaultBodyForBankItem(item);

  const question: QaQuestion = {
    id: `qa-bank-${Date.now()}`,
    slug,
    title: item.title,
    body,
    category: item.category,
    status: "draft",
    authorKind: "virtual",
    authorDisplayName: author,
    isSeeded: false,
    answerCount: 0,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
    relatedArea: item.category === "rent" || item.category === "buy" ? "ubud" : undefined,
  };

  await persistQuestion(question);
  await setBankQueueEntry({
    bankKey,
    status: "accepted",
    questionId: question.id,
    updatedAt: now,
  });

  const overview = await getScheduleOverview();
  return { question: (await getQuestionById(question.id)) ?? question, overview };
}
