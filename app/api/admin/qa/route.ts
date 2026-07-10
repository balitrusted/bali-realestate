import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { QaAnswer, QaAuthorKind, QaCategory, QaQuestion } from "@/types/qa";
import { slugifyQaTitle } from "@/lib/qaHub";
import {
  deleteQuestion,
  getAllQuestions,
  getAnswersForQuestionAdmin,
  getQuestionById,
  persistAnswer,
  persistQuestion,
  seedQaToSupabase,
  syncQuestionAnswerCount,
  updateAnswerContent,
  updateAnswerStatus,
} from "@/lib/qaPersistence";

const CATEGORIES: QaCategory[] = ["rent", "buy", "services", "living"];

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

function parseCategory(raw: unknown): QaCategory {
  const s = String(raw || "").trim();
  if (CATEGORIES.includes(s as QaCategory)) return s as QaCategory;
  return "rent";
}

function parseAuthorKind(raw: unknown): QaAuthorKind {
  const s = String(raw || "").trim();
  if (s === "member" || s === "official" || s === "virtual") return s;
  return "virtual";
}

export async function GET(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    if (questionId) {
      const answers = await getAnswersForQuestionAdmin(questionId);
      return NextResponse.json({ answers });
    }
    const questions = await getAllQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("admin qa GET:", error);
    return NextResponse.json({ error: "Failed to load Q&A" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (body.action === "seed") {
      const result = await seedQaToSupabase();
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === "approveAnswer") {
      const answerId = String(body.answerId || "").trim();
      if (!answerId) {
        return NextResponse.json({ error: "answerId required" }, { status: 400 });
      }
      const answer = await updateAnswerStatus(answerId, "approved");
      if (!answer) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }
      return NextResponse.json({ answer });
    }

    if (body.action === "rejectAnswer") {
      const answerId = String(body.answerId || "").trim();
      if (!answerId) {
        return NextResponse.json({ error: "answerId required" }, { status: 400 });
      }
      const answer = await updateAnswerStatus(answerId, "rejected");
      if (!answer) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }
      return NextResponse.json({ answer });
    }

    if (body.action === "updateAnswer") {
      const answerId = String(body.answerId || "").trim();
      const content = String(body.content || "").trim();
      if (!answerId || !content) {
        return NextResponse.json({ error: "answerId and content required" }, { status: 400 });
      }
      const answer = await updateAnswerContent(answerId, content);
      if (!answer) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }
      return NextResponse.json({ answer });
    }

    if (body.action === "answer") {
      const questionId = String(body.questionId || "").trim();
      const content = String(body.content || "").trim();
      if (!questionId || !content) {
        return NextResponse.json({ error: "questionId and content required" }, { status: 400 });
      }
      const question = await getQuestionById(questionId);
      if (!question) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
      const now = new Date().toISOString();
      const answer: QaAnswer = {
        id: String(body.id || `qa-ans-${Date.now()}`),
        questionId,
        authorKind: "official",
        authorDisplayName: String(body.authorDisplayName || "Balitrusted"),
        isOfficial: true,
        content,
        status: "approved",
        upvotes: 0,
        createdAt: now,
      };
      await persistAnswer(answer);
      await syncQuestionAnswerCount(questionId);
      return NextResponse.json({ answer });
    }

    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }
    const slugRaw =
      String(body.slug || "").trim() || slugifyQaTitle(title) || `qa-${Date.now()}`;
    const existing = await getAllQuestions();
    if (existing.some((q) => q.slug === slugRaw && q.id !== body.id)) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const published = Boolean(body.published);
    const question: QaQuestion = {
      id: String(body.id || `qa-${Date.now()}`),
      slug: slugRaw,
      title,
      body: body.body ? String(body.body).trim() : undefined,
      category: parseCategory(body.category),
      status: published ? "published" : "draft",
      authorKind: parseAuthorKind(body.authorKind),
      authorDisplayName: String(body.authorDisplayName || "Anonymous").trim() || "Anonymous",
      isSeeded: Boolean(body.isSeeded),
      answerCount: Number(body.answerCount) || 0,
      viewCount: Number(body.viewCount) || 0,
      createdAt: String(body.createdAt || now),
      publishedAt: published ? String(body.publishedAt || now) : undefined,
      updatedAt: now,
      seoTitle: body.seoTitle ? String(body.seoTitle).trim() : undefined,
      seoDescription: body.seoDescription ? String(body.seoDescription).trim() : undefined,
      relatedServiceId: body.relatedServiceId ? String(body.relatedServiceId).trim() : undefined,
      relatedArea: body.relatedArea ? String(body.relatedArea).trim() : undefined,
    };

    await persistQuestion(question);
    return NextResponse.json({ question });
  } catch (error) {
    console.error("admin qa POST:", error);
    const msg = error instanceof Error ? error.message : "Failed to save";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const existing = await getQuestionById(id);
    if (!existing) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    const slugRaw =
      body.slug !== undefined
        ? String(body.slug).trim()
        : existing.slug;
    const all = await getAllQuestions();
    if (all.some((q) => q.slug === slugRaw && q.id !== id)) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    }

    const published =
      body.published !== undefined ? Boolean(body.published) : existing.status === "published";
    const now = new Date().toISOString();

    const question: QaQuestion = {
      ...existing,
      slug: slugRaw,
      title,
      body: body.body !== undefined ? String(body.body).trim() || undefined : existing.body,
      category: body.category !== undefined ? parseCategory(body.category) : existing.category,
      status: published ? "published" : "draft",
      authorKind:
        body.authorKind !== undefined ? parseAuthorKind(body.authorKind) : existing.authorKind,
      authorDisplayName:
        body.authorDisplayName !== undefined
          ? String(body.authorDisplayName).trim()
          : existing.authorDisplayName,
      isSeeded: body.isSeeded !== undefined ? Boolean(body.isSeeded) : existing.isSeeded,
      publishedAt: published
        ? String(body.publishedAt || existing.publishedAt || now)
        : undefined,
      updatedAt: now,
      seoTitle:
        body.seoTitle !== undefined
          ? String(body.seoTitle).trim() || undefined
          : existing.seoTitle,
      seoDescription:
        body.seoDescription !== undefined
          ? String(body.seoDescription).trim() || undefined
          : existing.seoDescription,
      relatedServiceId:
        body.relatedServiceId !== undefined
          ? String(body.relatedServiceId).trim() || undefined
          : existing.relatedServiceId,
      relatedArea:
        body.relatedArea !== undefined
          ? String(body.relatedArea).trim() || undefined
          : existing.relatedArea,
    };

    await persistQuestion(question);
    return NextResponse.json({ question });
  } catch (error) {
    console.error("admin qa PUT:", error);
    const msg = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await deleteQuestion(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin qa DELETE:", error);
    const msg = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
