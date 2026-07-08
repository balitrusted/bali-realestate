"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { qaCategoryLabel } from "@/lib/qaHub";
import type { QaBankProposal, QaScheduleOverview } from "@/lib/qaScheduler";

export default function AdminQaSchedulePage() {
  const router = useRouter();
  const [overview, setOverview] = useState<QaScheduleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<"accept" | "skip" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/qa/schedule");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load");
      }
      setOverview(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action: "accept" | "skip") => {
    if (!overview?.proposal) return;
    setActing(action);
    setError(null);
    try {
      const res = await fetch("/api/admin/qa/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, bankKey: overview.proposal.bankKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Action failed");

      if (action === "accept" && data.question?.id) {
        router.push(`/admin/qa/edit/${encodeURIComponent(data.question.id)}`);
        return;
      }
      setOverview(data.overview ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return <p>Loading content pipeline…</p>;
  }

  const stats = overview?.stats;
  const proposal: QaBankProposal | null = overview?.proposal ?? null;

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Q&amp;A content pipeline</h1>
          <p className="text-sm text-gray-600 mt-1">
            Target pace: <strong>2 published questions per week</strong>. Approve or skip proposals from the bank,
            then write the official answer on the edit screen.
          </p>
        </div>
        <Link
          href="/admin/qa"
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
        >
          Back to Q&amp;A list
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {stats ? (
        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          <StatCard
            label="Published this week"
            value={`${stats.publishedThisWeek} / ${stats.weeklyQuota}`}
            hint={stats.quotaReached ? "Weekly target reached" : "Room for more this week"}
          />
          <StatCard label="Remaining in bank" value={String(stats.remainingInBank)} />
          <StatCard label="Drafts awaiting answer" value={String(stats.draftsAwaitingAnswer)} />
          <StatCard label="Skipped" value={String(stats.skippedCount)} />
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Next proposal</h2>

        {proposal ? (
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                {qaCategoryLabel(proposal.category)}
              </div>
              <div className="text-xl font-medium text-gray-900">{proposal.title}</div>
            </div>

            {proposal.suggestedBody ? (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Suggested question body</div>
                <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                  {proposal.suggestedBody}
                </p>
              </div>
            ) : null}

            <p className="text-sm text-gray-500">
              Virtual author: <span className="text-gray-800">{proposal.suggestedAuthor}</span>
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => runAction("accept")}
                disabled={acting !== null}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
              >
                {acting === "accept" ? "Creating draft…" : "Approve → write answer"}
              </button>
              <button
                type="button"
                onClick={() => runAction("skip")}
                disabled={acting !== null}
                className="px-5 py-2.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {acting === "skip" ? "Skipping…" : "Skip → next proposal"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">
            No proposals left in the bank (or everything is already used/skipped). Add more titles to{" "}
            <code className="text-xs">data/qa/questionBank.ts</code>.
          </p>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/60 p-5 text-sm text-gray-700 leading-relaxed">
        <h3 className="font-semibold text-gray-900 mb-2">Workflow with Cursor</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Approve a question here (creates a draft).</li>
          <li>On the edit page, copy the title + body into Cursor and ask for an official Balitrusted answer.</li>
          <li>Paste the answer under <strong>Official answers</strong>, tick <strong>Published</strong>, save.</li>
        </ol>
        <p className="mt-3 text-gray-600">
          Run SQL migration <code className="text-xs">008_qa_bank_queue.sql</code> in Supabase so skip/approve state
          persists on production.
        </p>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold text-gray-900 mt-1">{value}</div>
      {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
    </div>
  );
}
