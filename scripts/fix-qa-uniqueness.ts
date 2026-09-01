import { loadEnvConfig } from "@next/env";
import {
  applyQaUniquenessFixes,
  planQaUniquenessFixes,
} from "@/lib/qaFixUniqueness";
import { getAllQuestions, persistQuestion } from "@/lib/qaPersistence";
import { isSupabaseConfigured } from "@/lib/supabaseServer";

loadEnvConfig(process.cwd());

async function main() {
  if (!isSupabaseConfigured()) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
  }

  const questions = await getAllQuestions();
  const fixes = planQaUniquenessFixes(questions);

  if (fixes.length === 0) {
    console.log("All questions have unique bodies and author names.");
    return;
  }

  console.log(`Planned ${fixes.length} fix(es):`);
  for (const fix of fixes) {
    console.log(`- ${fix.questionId}: ${fix.title}`);
    console.log(`  reasons: ${fix.reasons.join(", ")}`);
    if (fix.body) console.log(`  body -> ${fix.body.slice(0, 80)}…`);
    if (fix.authorDisplayName) console.log(`  author -> ${fix.authorDisplayName}`);
  }

  const updated = applyQaUniquenessFixes(questions, fixes);
  for (const q of updated) {
    if (fixes.some((f) => f.questionId === q.id)) {
      await persistQuestion(q);
    }
  }

  console.log(`Updated ${fixes.length} question(s) in Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
