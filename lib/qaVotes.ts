import type { NextRequest } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

const VOTES_PER_HOUR_LIMIT = 25;

export function getQaVoterKey(request: Request | NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0]?.trim()
    : request.headers.get("x-real-ip")?.trim();
  return `ip:${ip || "anonymous"}`;
}

export async function getAnswerUpvoteState(
  answerId: string,
  voterKey: string
): Promise<{ upvotes: number; liked: boolean }> {
  if (!isSupabaseConfigured()) {
    return { upvotes: 0, liked: false };
  }
  const supabase = getSupabaseServerClient();
  const [{ data: answer }, { data: vote }] = await Promise.all([
    supabase.from("qa_answers").select("upvotes").eq("id", answerId).maybeSingle(),
    supabase
      .from("qa_answer_votes")
      .select("answer_id")
      .eq("answer_id", answerId)
      .eq("voter_key", voterKey)
      .maybeSingle(),
  ]);
  return {
    upvotes: (answer as { upvotes?: number } | null)?.upvotes ?? 0,
    liked: !!vote,
  };
}

export async function getAnswerUpvoteStates(
  answerIds: string[],
  voterKey: string
): Promise<Record<string, { upvotes: number; liked: boolean }>> {
  const out: Record<string, { upvotes: number; liked: boolean }> = {};
  if (!answerIds.length || !isSupabaseConfigured()) return out;

  const supabase = getSupabaseServerClient();
  const [{ data: answers }, { data: votes }] = await Promise.all([
    supabase.from("qa_answers").select("id,upvotes").in("id", answerIds),
    supabase
      .from("qa_answer_votes")
      .select("answer_id")
      .in("answer_id", answerIds)
      .eq("voter_key", voterKey),
  ]);

  const liked = new Set(
    ((votes as Array<{ answer_id: string }> | null) ?? []).map((v) => v.answer_id)
  );
  for (const id of answerIds) {
    const row = ((answers as Array<{ id: string; upvotes: number }> | null) ?? []).find(
      (a) => a.id === id
    );
    out[id] = { upvotes: row?.upvotes ?? 0, liked: liked.has(id) };
  }
  return out;
}

async function countRecentVotesByVoter(voterKey: string): Promise<number> {
  const supabase = getSupabaseServerClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("qa_answer_votes")
    .select("answer_id", { count: "exact", head: true })
    .eq("voter_key", voterKey)
    .gte("created_at", since);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Toggle upvote. Returns new count and liked state. */
export async function toggleAnswerUpvote(
  answerId: string,
  voterKey: string
): Promise<{ upvotes: number; liked: boolean }> {
  if (!isSupabaseConfigured()) {
    throw new Error("[qa] Supabase is not configured.");
  }
  const supabase = getSupabaseServerClient();

  const { data: answerRow, error: answerErr } = await supabase
    .from("qa_answers")
    .select("id,upvotes,status,question_id")
    .eq("id", answerId)
    .maybeSingle();
  if (answerErr) throw new Error(answerErr.message);
  if (!answerRow) throw new Error("Answer not found");
  if ((answerRow as { status: string }).status !== "approved") {
    throw new Error("Answer not available");
  }

  const { data: existingVote } = await supabase
    .from("qa_answer_votes")
    .select("answer_id")
    .eq("answer_id", answerId)
    .eq("voter_key", voterKey)
    .maybeSingle();

  let upvotes = (answerRow as { upvotes: number }).upvotes ?? 0;
  let liked: boolean;

  if (existingVote) {
    const { error: delErr } = await supabase
      .from("qa_answer_votes")
      .delete()
      .eq("answer_id", answerId)
      .eq("voter_key", voterKey);
    if (delErr) throw new Error(delErr.message);
    upvotes = Math.max(0, upvotes - 1);
    liked = false;
  } else {
    const recent = await countRecentVotesByVoter(voterKey);
    if (recent >= VOTES_PER_HOUR_LIMIT) {
      const err = new Error("RATE_LIMIT");
      (err as Error & { code: string }).code = "RATE_LIMIT";
      throw err;
    }
    const { error: insErr } = await supabase
      .from("qa_answer_votes")
      .insert({ answer_id: answerId, voter_key: voterKey });
    if (insErr) throw new Error(insErr.message);
    upvotes += 1;
    liked = true;
  }

  const { error: updErr } = await supabase
    .from("qa_answers")
    .update({ upvotes, updated_at: new Date().toISOString() })
    .eq("id", answerId);
  if (updErr) throw new Error(updErr.message);

  return { upvotes, liked };
}

/** Record a seeded virtual like (does not change upvotes; count already in seed data). */
export async function recordVirtualAnswerUpvote(
  answerId: string,
  virtualAuthorName: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const voterKey = `seed:virtual:${virtualAuthorName}`;
  const supabase = getSupabaseServerClient();
  const { data: existing } = await supabase
    .from("qa_answer_votes")
    .select("answer_id")
    .eq("answer_id", answerId)
    .eq("voter_key", voterKey)
    .maybeSingle();
  if (existing) return;
  await supabase.from("qa_answer_votes").insert({ answer_id: answerId, voter_key: voterKey });
}
