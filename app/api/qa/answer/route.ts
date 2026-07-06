import { NextResponse } from "next/server";
import { sendToAdmin } from "@/lib/email";
import { isSupabaseConfigured } from "@/lib/supabaseServer";
import { getQuestionById, submitGuestAnswer } from "@/lib/qaPersistence";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Replies are temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as {
      questionId?: string;
      authorName?: string;
      authorEmail?: string;
      content?: string;
    };

    const questionId = body.questionId?.trim() || "";
    const authorName = body.authorName?.trim() || "";
    const authorEmail = body.authorEmail?.trim() || "";
    const content = body.content?.trim() || "";

    if (!questionId || !authorName || !authorEmail || !content) {
      return NextResponse.json(
        { error: "Question, name, email, and answer are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (content.length < 20) {
      return NextResponse.json(
        { error: "Please write a bit more detail (at least 20 characters)." },
        { status: 400 }
      );
    }

    const question = await getQuestionById(questionId);
    if (!question || question.status !== "published") {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const answer = await submitGuestAnswer({
      questionId,
      authorName,
      authorEmail,
      content,
    });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const subject = `[Balitrusted] New Q&A reply to moderate`;
      const html = `
        <p><strong>New community answer (awaiting moderation)</strong></p>
        <p><strong>Question:</strong> ${question.title}</p>
        <p><strong>From:</strong> ${authorName} &lt;${authorEmail}&gt;</p>
        <p><strong>Answer:</strong></p>
        <p>${content.replace(/\n/g, "<br>")}</p>
        <p><a href="${baseUrl}/admin/qa/edit/${encodeURIComponent(question.id)}">Moderate in admin</a></p>
      `;
      await sendToAdmin(subject, html);
    } catch (err) {
      console.error("[qa/answer] admin notify failed:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Thanks! Your answer was submitted and will appear after moderation.",
    });
  } catch (error) {
    console.error("[qa/answer]", error);
    return NextResponse.json({ error: "Failed to submit answer." }, { status: 500 });
  }
}
