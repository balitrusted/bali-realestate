import { NextResponse } from "next/server";
import {
  getAnswerUpvoteState,
  getAnswerUpvoteStates,
  getQaVoterKey,
  toggleAnswerUpvote,
} from "@/lib/qaVotes";
import { isSupabaseConfigured } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ states: {} });
  }
  try {
    const { searchParams } = new URL(request.url);
    const answerId = searchParams.get("answerId");
    const answerIdsRaw = searchParams.get("answerIds");
    const voterKey = getQaVoterKey(request);

    if (answerIdsRaw) {
      const ids = answerIdsRaw.split(",").map((s) => s.trim()).filter(Boolean);
      const states = await getAnswerUpvoteStates(ids, voterKey);
      return NextResponse.json({ states });
    }

    if (!answerId) {
      return NextResponse.json({ error: "answerId or answerIds required" }, { status: 400 });
    }

    const state = await getAnswerUpvoteState(answerId, voterKey);
    return NextResponse.json(state);
  } catch (error) {
    console.error("[api/qa/vote] GET", error);
    return NextResponse.json({ upvotes: 0, liked: false });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Voting is temporarily unavailable." }, { status: 503 });
  }
  try {
    const body = (await request.json()) as { answerId?: string };
    const answerId = body.answerId?.trim();
    if (!answerId) {
      return NextResponse.json({ error: "answerId required" }, { status: 400 });
    }

    const voterKey = getQaVoterKey(request);
    const result = await toggleAnswerUpvote(answerId, voterKey);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMIT") {
      return NextResponse.json(
        { error: "Too many likes in a short time. Please try again later." },
        { status: 429 }
      );
    }
    if (error instanceof Error && error.message === "Answer not found") {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }
    console.error("[api/qa/vote] POST", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
