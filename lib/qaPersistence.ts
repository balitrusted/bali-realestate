import {
  getSeedAnswers,
  getSeedAnswersForQuestion,
  getSeedQuestionBySlug,
  getSeedQuestions,
} from "@/data/qa/seed";
import { slugifyQaTitle } from "@/lib/qaHub";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";
import type {
  QaAnswer,
  QaAuthorKind,
  QaCategory,
  QaQuestion,
  QaQuestionStatus,
  QaQuestionWithAnswers,
  QaRecentItem,
} from "@/types/qa";

type QuestionRow = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  category: string;
  status: string;
  author_kind: string;
  author_display_name: string;
  author_email: string | null;
  author_user_id: string | null;
  is_seeded: boolean;
  answer_count: number;
  view_count: number;
  created_at: string;
  published_at: string | null;
  updated_at: string;
  seo_title: string | null;
  seo_description: string | null;
  related_service_id: string | null;
  related_area: string | null;
};

type AnswerRow = {
  id: string;
  question_id: string;
  parent_id: string | null;
  author_kind: string;
  author_display_name: string;
  author_email: string | null;
  author_user_id: string | null;
  is_official: boolean;
  content: string;
  status: string;
  upvotes: number;
  created_at: string;
  updated_at: string | null;
};

function mapQuestionRow(row: QuestionRow): QaQuestion {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body ?? undefined,
    category: row.category as QaCategory,
    status: row.status as QaQuestionStatus,
    authorKind: row.author_kind as QaAuthorKind,
    authorDisplayName: row.author_display_name,
    authorEmail: row.author_email ?? undefined,
    authorUserId: row.author_user_id ?? undefined,
    isSeeded: row.is_seeded,
    answerCount: row.answer_count,
    viewCount: row.view_count,
    createdAt: row.created_at,
    publishedAt: row.published_at ?? undefined,
    updatedAt: row.updated_at,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    relatedServiceId: row.related_service_id ?? undefined,
    relatedArea: row.related_area ?? undefined,
  };
}

function mapAnswerRow(row: AnswerRow): QaAnswer {
  return {
    id: row.id,
    questionId: row.question_id,
    parentId: row.parent_id ?? undefined,
    authorKind: row.author_kind as QaAuthorKind,
    authorDisplayName: row.author_display_name,
    authorEmail: row.author_email ?? undefined,
    authorUserId: row.author_user_id ?? undefined,
    isOfficial: row.is_official,
    content: row.content,
    status: row.status as QaAnswer["status"],
    upvotes: row.upvotes,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapQuestionToRow(q: QaQuestion): QuestionRow {
  return {
    id: q.id,
    slug: q.slug,
    title: q.title,
    body: q.body ?? null,
    category: q.category,
    status: q.status,
    author_kind: q.authorKind,
    author_display_name: q.authorDisplayName,
    author_email: q.authorEmail ?? null,
    author_user_id: q.authorUserId ?? null,
    is_seeded: q.isSeeded,
    answer_count: q.answerCount,
    view_count: q.viewCount,
    created_at: q.createdAt,
    published_at: q.publishedAt ?? null,
    updated_at: q.updatedAt,
    seo_title: q.seoTitle ?? null,
    seo_description: q.seoDescription ?? null,
    related_service_id: q.relatedServiceId ?? null,
    related_area: q.relatedArea ?? null,
  };
}

function mapAnswerToRow(a: QaAnswer): AnswerRow {
  return {
    id: a.id,
    question_id: a.questionId,
    parent_id: a.parentId ?? null,
    author_kind: a.authorKind,
    author_display_name: a.authorDisplayName,
    author_email: a.authorEmail ?? null,
    author_user_id: a.authorUserId ?? null,
    is_official: a.isOfficial,
    content: a.content,
    status: a.status,
    upvotes: a.upvotes,
    created_at: a.createdAt,
    updated_at: a.updatedAt ?? null,
  };
}

const QUESTION_SELECT =
  "id,slug,title,body,category,status,author_kind,author_display_name,author_email,author_user_id,is_seeded,answer_count,view_count,created_at,published_at,updated_at,seo_title,seo_description,related_service_id,related_area";

const ANSWER_SELECT =
  "id,question_id,parent_id,author_kind,author_display_name,author_email,author_user_id,is_official,content,status,upvotes,created_at,updated_at";

/** Skip repeated Supabase calls when 004_qa.sql has not been applied yet. */
let qaSupabaseUnavailable = false;

function isMissingQaTableError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    (m.includes("qa_questions") || m.includes("qa_answers") || m.includes("schema cache")) &&
    (m.includes("could not find") || m.includes("does not exist") || m.includes("not find"))
  );
}

async function readQuestionsFromSupabase(): Promise<QaQuestion[] | null> {
  if (!isSupabaseConfigured() || qaSupabaseUnavailable) return null;
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("qa_questions")
      .select(QUESTION_SELECT)
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) {
      if (isMissingQaTableError(error.message)) {
        qaSupabaseUnavailable = true;
        return null;
      }
      console.error("[qa] Supabase questions read failed:", error.message);
      return null;
    }
    return ((data as QuestionRow[] | null) ?? []).map(mapQuestionRow);
  } catch (error) {
    console.error("[qa] Supabase questions read exception:", error);
    return null;
  }
}

async function readAnswersFromSupabase(): Promise<QaAnswer[] | null> {
  if (!isSupabaseConfigured() || qaSupabaseUnavailable) return null;
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("qa_answers")
      .select(ANSWER_SELECT)
      .order("created_at", { ascending: true });
    if (error) {
      if (isMissingQaTableError(error.message)) {
        qaSupabaseUnavailable = true;
        return null;
      }
      console.error("[qa] Supabase answers read failed:", error.message);
      return null;
    }
    return ((data as AnswerRow[] | null) ?? []).map(mapAnswerRow);
  } catch (error) {
    console.error("[qa] Supabase answers read exception:", error);
    return null;
  }
}

async function getAllQuestionsRaw(): Promise<QaQuestion[]> {
  const fromDb = await readQuestionsFromSupabase();
  if (fromDb && fromDb.length > 0) return fromDb;
  return getSeedQuestions();
}

async function getAllAnswersRaw(): Promise<QaAnswer[]> {
  const fromDb = await readAnswersFromSupabase();
  if (fromDb && fromDb.length > 0) return fromDb;
  return getSeedAnswers();
}

function sortPublishedFirst(questions: QaQuestion[]): QaQuestion[] {
  return [...questions].sort((a, b) => {
    const ta = new Date(a.publishedAt || a.createdAt).getTime();
    const tb = new Date(b.publishedAt || b.createdAt).getTime();
    return tb - ta;
  });
}

export async function getPublishedQuestions(category?: QaCategory): Promise<QaQuestion[]> {
  const all = await getAllQuestionsRaw();
  let list = all.filter((q) => q.status === "published");
  if (category) list = list.filter((q) => q.category === category);
  return sortPublishedFirst(list);
}

export async function getAllQuestions(): Promise<QaQuestion[]> {
  const all = await getAllQuestionsRaw();
  return sortPublishedFirst(all);
}

export async function getQuestionBySlug(slug: string): Promise<QaQuestion | null> {
  const fromDb = await readQuestionsFromSupabase();
  if (fromDb && fromDb.length > 0) {
    return fromDb.find((q) => q.slug === slug) ?? null;
  }
  return getSeedQuestionBySlug(slug) ?? null;
}

export async function getQuestionById(id: string): Promise<QaQuestion | null> {
  const all = await getAllQuestionsRaw();
  return all.find((q) => q.id === id) ?? null;
}

export async function getAnswersForQuestion(questionId: string): Promise<QaAnswer[]> {
  const all = await getAllAnswersRaw();
  return all
    .filter((a) => a.questionId === questionId && a.status === "approved")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getQuestionWithAnswers(slug: string): Promise<QaQuestionWithAnswers | null> {
  const question = await getQuestionBySlug(slug);
  if (!question || question.status !== "published") return null;
  const answers = await getAnswersForQuestion(question.id);
  return { ...question, answers };
}

function snippet(text: string, max = 100): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function getRecentActivity(limit = 12): Promise<QaRecentItem[]> {
  const [questions, answers] = await Promise.all([
    getPublishedQuestions(),
    getAllAnswersRaw(),
  ]);
  const qById = new Map(questions.map((q) => [q.id, q]));
  const items: QaRecentItem[] = [];

  for (const q of questions) {
    items.push({
      type: "question",
      id: q.id,
      questionId: q.id,
      questionSlug: q.slug,
      questionTitle: q.title,
      category: q.category,
      authorDisplayName: q.authorDisplayName,
      snippet: snippet(q.body || q.title),
      at: q.publishedAt || q.createdAt,
    });
  }

  for (const a of answers) {
    if (a.status !== "approved") continue;
    const q = qById.get(a.questionId);
    if (!q) continue;
    items.push({
      type: "answer",
      id: a.id,
      questionId: q.id,
      questionSlug: q.slug,
      questionTitle: q.title,
      category: q.category,
      authorDisplayName: a.authorDisplayName,
      snippet: snippet(a.content),
      isOfficial: a.isOfficial,
      at: a.createdAt,
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, limit);
}

export async function persistQuestion(question: QaQuestion): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[qa] Supabase is not configured. Apply migration 004_qa.sql and set env vars.");
  }
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("qa_questions")
    .upsert(mapQuestionToRow(question), { onConflict: "id" });
  if (error) {
    throw new Error(`[qa] question upsert failed: ${error.message}`);
  }
}

export async function persistAnswer(answer: QaAnswer): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[qa] Supabase is not configured.");
  }
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("qa_answers")
    .upsert(mapAnswerToRow(answer), { onConflict: "id" });
  if (error) {
    throw new Error(`[qa] answer upsert failed: ${error.message}`);
  }
}

export async function deleteQuestion(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("[qa] Supabase is not configured.");
  }
  const supabase = getSupabaseServerClient();
  const { error: ansErr } = await supabase.from("qa_answers").delete().eq("question_id", id);
  if (ansErr) throw new Error(ansErr.message);
  const { error } = await supabase.from("qa_questions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function syncQuestionAnswerCount(questionId: string): Promise<void> {
  const answers = await getAnswersForQuestion(questionId);
  const q = await getQuestionById(questionId);
  if (!q) return;
  await persistQuestion({
    ...q,
    answerCount: answers.length,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAnswersForQuestionAdmin(questionId: string): Promise<QaAnswer[]> {
  const all = await getAllAnswersRaw();
  return all
    .filter((a) => a.questionId === questionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** Upload bundled seed into Supabase (idempotent upsert). */
export async function seedQaToSupabase(): Promise<{ questions: number; answers: number }> {
  if (!isSupabaseConfigured()) {
    throw new Error("[qa] Supabase is not configured.");
  }
  const questions = getSeedQuestions();
  const answers = getSeedAnswers();
  for (const q of questions) {
    await persistQuestion(q);
  }
  for (const a of answers) {
    await persistAnswer(a);
  }
  return { questions: questions.length, answers: answers.length };
}

export async function countPendingGuestQuestions(): Promise<number> {
  const all = await getAllQuestionsRaw();
  return all.filter((q) => q.status === "draft" && !q.isSeeded).length;
}

export async function countPendingGuestAnswers(): Promise<number> {
  const all = await getAllAnswersRaw();
  return all.filter((a) => a.status === "pending" && !a.isOfficial).length;
}

export async function countPendingQaModeration(): Promise<number> {
  const [questions, answers] = await Promise.all([
    countPendingGuestQuestions(),
    countPendingGuestAnswers(),
  ]);
  return questions + answers;
}

export async function getAnswerById(id: string): Promise<QaAnswer | null> {
  const all = await getAllAnswersRaw();
  return all.find((a) => a.id === id) ?? null;
}

export async function updateAnswerStatus(
  answerId: string,
  status: QaAnswer["status"]
): Promise<QaAnswer | null> {
  const existing = await getAnswerById(answerId);
  if (!existing) return null;
  const updated: QaAnswer = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };
  await persistAnswer(updated);
  await syncQuestionAnswerCount(existing.questionId);
  return updated;
}

async function uniqueSlug(base: string): Promise<string> {
  const all = await getAllQuestionsRaw();
  const taken = new Set(all.map((q) => q.slug));
  let slug = base || `question-${Date.now()}`;
  if (!taken.has(slug)) return slug;
  let n = 2;
  while (taken.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}

export interface SubmitGuestQuestionInput {
  authorName: string;
  authorEmail: string;
  title: string;
  body?: string;
  category: QaCategory;
}

/** Public submit: draft until admin publishes. Email stored for moderation only. */
export async function submitGuestQuestion(input: SubmitGuestQuestionInput): Promise<QaQuestion> {
  if (!isSupabaseConfigured()) {
    throw new Error("[qa] Supabase is not configured.");
  }
  const now = new Date().toISOString();
  const baseSlug = slugifyQaTitle(input.title);
  const slug = await uniqueSlug(baseSlug);
  const question: QaQuestion = {
    id: `qa-guest-${Date.now()}`,
    slug,
    title: input.title.trim(),
    body: input.body?.trim() || undefined,
    category: input.category,
    status: "draft",
    authorKind: "member",
    authorDisplayName: input.authorName.trim(),
    authorEmail: input.authorEmail.trim(),
    isSeeded: false,
    answerCount: 0,
    viewCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await persistQuestion(question);
  return question;
}

export interface SubmitGuestAnswerInput {
  questionId: string;
  authorName: string;
  authorEmail: string;
  content: string;
}

export async function submitGuestAnswer(input: SubmitGuestAnswerInput): Promise<QaAnswer> {
  if (!isSupabaseConfigured()) {
    throw new Error("[qa] Supabase is not configured.");
  }
  const question = await getQuestionById(input.questionId);
  if (!question || question.status !== "published") {
    throw new Error("Question not found");
  }
  const now = new Date().toISOString();
  const answer: QaAnswer = {
    id: `qa-ans-guest-${Date.now()}`,
    questionId: input.questionId,
    authorKind: "member",
    authorDisplayName: input.authorName.trim(),
    authorEmail: input.authorEmail.trim(),
    isOfficial: false,
    content: input.content.trim(),
    status: "pending",
    upvotes: 0,
    createdAt: now,
  };
  await persistAnswer(answer);
  return answer;
}
