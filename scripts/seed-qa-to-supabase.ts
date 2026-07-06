import { loadEnvConfig } from "@next/env";
import { QA_SEED_ANSWERS, QA_SEED_QUESTIONS } from "@/data/qa/seed";
import { isSupabaseConfigured } from "@/lib/supabaseServer";
import { seedQaToSupabase } from "@/lib/qaPersistence";
import { recordVirtualAnswerUpvote } from "@/lib/qaVotes";

loadEnvConfig(process.cwd());

async function seedVirtualAuthorLikes(): Promise<number> {
  let n = 0;
  for (const q of QA_SEED_QUESTIONS) {
    const official = QA_SEED_ANSWERS.find((a) => a.questionId === q.id && a.isOfficial);
    if (!official) continue;
    // ~60% of seeded threads: asker "liked" the official answer
    const hash = q.id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    if (hash % 10 >= 6) continue;
    await recordVirtualAnswerUpvote(official.id, q.authorDisplayName);
    n++;
  }
  return n;
}

async function main() {
  if (!isSupabaseConfigured()) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local (same vars as npm run dev)."
    );
    process.exit(1);
  }
  const result = await seedQaToSupabase();
  let virtualLikes = 0;
  try {
    virtualLikes = await seedVirtualAuthorLikes();
  } catch (e) {
    console.warn("Virtual author likes skipped (run 006_qa_answer_votes.sql?):", e);
  }
  console.log(
    `Seeded ${result.questions} questions, ${result.answers} answers, ${virtualLikes} virtual author likes.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
