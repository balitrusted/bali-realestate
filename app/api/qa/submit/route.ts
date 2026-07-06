import { NextResponse } from "next/server";
import { sendToAdmin } from "@/lib/email";
import { qaCategoryLabel } from "@/lib/qaHub";
import { isSupabaseConfigured } from "@/lib/supabaseServer";
import { submitGuestQuestion } from "@/lib/qaPersistence";
import type { QaCategory } from "@/types/qa";

const CATEGORIES: QaCategory[] = ["rent", "buy", "services", "living"];

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Questions are temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      authorName?: string;
      authorEmail?: string;
      title?: string;
      questionBody?: string;
      category?: string;
    };

    const authorName = body.authorName?.trim() || "";
    const authorEmail = body.authorEmail?.trim() || "";
    const title = body.title?.trim() || "";
    const questionBody = body.questionBody?.trim();
    const categoryRaw = body.category?.trim() || "rent";
    const category = CATEGORIES.includes(categoryRaw as QaCategory)
      ? (categoryRaw as QaCategory)
      : "rent";

    if (!authorName || !authorEmail || !title) {
      return NextResponse.json(
        { error: "Name, email, and question title are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (title.length < 10) {
      return NextResponse.json(
        { error: "Please write a slightly longer question (at least 10 characters)." },
        { status: 400 }
      );
    }

    const question = await submitGuestQuestion({
      authorName,
      authorEmail,
      title,
      body: questionBody,
      category,
    });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const subject = `[Balitrusted] New Q&A question to moderate`;
      const html = `
        <p><strong>New question (awaiting moderation)</strong></p>
        <p><strong>Category:</strong> ${qaCategoryLabel(category)}</p>
        <p><strong>From:</strong> ${authorName} &lt;${authorEmail}&gt;</p>
        <p><strong>Question:</strong> ${title}</p>
        ${questionBody ? `<p><strong>Details:</strong></p><p>${questionBody.replace(/\n/g, "<br>")}</p>` : ""}
        <p><a href="${baseUrl}/admin/qa/edit/${encodeURIComponent(question.id)}">Moderate in admin</a></p>
      `;
      await sendToAdmin(subject, html);
    } catch (err) {
      console.error("[qa/submit] admin notify failed:", err);
    }

    return NextResponse.json({
      success: true,
      message:
        "Thanks! Your question was submitted and will appear after moderation.",
    });
  } catch (error) {
    console.error("[qa/submit]", error);
    return NextResponse.json({ error: "Failed to submit question." }, { status: 500 });
  }
}
