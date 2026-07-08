import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";

export type QaBankQueueStatus = "skipped" | "accepted";

export type QaBankQueueEntry = {
  bankKey: string;
  status: QaBankQueueStatus;
  questionId?: string;
  updatedAt: string;
};

type FileBankState = {
  skippedKeys: string[];
  accepted: Record<string, string>;
};

const STATE_PATH = path.join(process.cwd(), "data", "qa", "bankState.json");

function readFileState(): FileBankState {
  try {
    const raw = readFileSync(STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as FileBankState;
    return {
      skippedKeys: Array.isArray(parsed.skippedKeys) ? parsed.skippedKeys : [],
      accepted: parsed.accepted && typeof parsed.accepted === "object" ? parsed.accepted : {},
    };
  } catch {
    return { skippedKeys: [], accepted: {} };
  }
}

function writeFileState(state: FileBankState): void {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function fileEntries(state: FileBankState): QaBankQueueEntry[] {
  const now = new Date().toISOString();
  const entries: QaBankQueueEntry[] = [];
  for (const bankKey of state.skippedKeys) {
    entries.push({ bankKey, status: "skipped", updatedAt: now });
  }
  for (const [bankKey, questionId] of Object.entries(state.accepted)) {
    entries.push({ bankKey, status: "accepted", questionId, updatedAt: now });
  }
  return entries;
}

async function readSupabaseEntries(): Promise<QaBankQueueEntry[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("qa_bank_queue").select("bank_key,status,question_id,updated_at");
  if (error) {
    if (error.code === "42P01" || error.message.includes("qa_bank_queue")) return null;
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    bankKey: row.bank_key as string,
    status: row.status as QaBankQueueStatus,
    questionId: (row.question_id as string | null) ?? undefined,
    updatedAt: row.updated_at as string,
  }));
}

async function upsertSupabaseEntry(entry: QaBankQueueEntry): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("qa_bank_queue").upsert({
    bank_key: entry.bankKey,
    status: entry.status,
    question_id: entry.questionId ?? null,
    updated_at: entry.updatedAt,
  });
  if (error) {
    if (error.code === "42P01" || error.message.includes("qa_bank_queue")) return false;
    throw new Error(error.message);
  }
  return true;
}

export async function getBankQueueEntries(): Promise<QaBankQueueEntry[]> {
  const fromDb = await readSupabaseEntries();
  if (fromDb) return fromDb;
  return fileEntries(readFileState());
}

export async function setBankQueueEntry(entry: QaBankQueueEntry): Promise<void> {
  const saved = await upsertSupabaseEntry(entry);
  if (saved) return;

  const state = readFileState();
  state.skippedKeys = state.skippedKeys.filter((k) => k !== entry.bankKey);
  delete state.accepted[entry.bankKey];
  if (entry.status === "skipped") {
    if (!state.skippedKeys.includes(entry.bankKey)) state.skippedKeys.push(entry.bankKey);
  } else {
    state.accepted[entry.bankKey] = entry.questionId ?? "";
  }
  writeFileState(state);
}
