"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { QaAnswer, QaQuestion } from "@/types/qa";
import QaQuestionForm from "@/components/admin/QaQuestionForm";

function answerStatusLabel(status: QaAnswer["status"]): string {
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
  return "Published";
}

export default function AdminQaEditPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [question, setQuestion] = useState<QaQuestion | null>(null);
  const [answers, setAnswers] = useState<QaAnswer[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const loadAnswers = useCallback(async () => {
    if (!id) return;
    const aRes = await fetch(`/api/admin/qa?questionId=${encodeURIComponent(id)}`);
    if (aRes.ok) {
      const aData = await aRes.json();
      setAnswers(aData.answers || []);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const qRes = await fetch("/api/admin/qa");
        if (qRes.ok) {
          const qData = await qRes.json();
          const found = (qData.questions as QaQuestion[]).find((x) => x.id === id);
          setQuestion(found || null);
        }
        await loadAnswers();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, loadAnswers]);

  const submitAnswer = async () => {
    if (!answerText.trim() || !id) return;
    setSavingAnswer(true);
    try {
      const res = await fetch("/api/admin/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          questionId: id,
          content: answerText.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnswers((prev) => [...prev, data.answer]);
        setAnswerText("");
        setQuestion((q) => (q ? { ...q, answerCount: q.answerCount + 1 } : q));
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Failed to post answer");
      }
    } catch {
      alert("Failed to post answer");
    } finally {
      setSavingAnswer(false);
    }
  };

  const moderateAnswer = async (answerId: string, action: "approveAnswer" | "rejectAnswer") => {
    setModeratingId(answerId);
    try {
      const res = await fetch("/api/admin/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, answerId }),
      });
      if (res.ok) {
        await loadAnswers();
        const qRes = await fetch("/api/admin/qa");
        if (qRes.ok) {
          const qData = await qRes.json();
          const found = (qData.questions as QaQuestion[]).find((x) => x.id === id);
          if (found) setQuestion(found);
        }
        window.dispatchEvent(new Event("admin-badges-refresh"));
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Moderation failed");
      }
    } catch {
      alert("Moderation failed");
    } finally {
      setModeratingId(null);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (!question) return <p>Question not found.</p>;

  const communityAnswers = answers.filter((a) => !a.isOfficial);
  const officialAnswers = answers.filter((a) => a.isOfficial);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Q&amp;A</h1>
      <QaQuestionForm question={question} />

      <section className="mt-10 pt-8 border-t border-gray-200 max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Community answers</h2>
        {communityAnswers.length === 0 ? (
          <p className="text-sm text-gray-600 mb-6">No community answers yet.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {communityAnswers.map((a) => (
              <li
                key={a.id}
                className={`p-4 rounded-lg border text-sm ${
                  a.status === "pending"
                    ? "bg-amber-50 border-amber-200"
                    : a.status === "rejected"
                      ? "bg-red-50 border-red-100 opacity-75"
                      : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-gray-600">
                  <span className="font-medium text-gray-900">{a.authorDisplayName}</span>
                  {a.authorEmail ? <span>{a.authorEmail}</span> : null}
                  <span>· {answerStatusLabel(a.status)}</span>
                </div>
                <p className="text-gray-800 whitespace-pre-line">{a.content}</p>
                {a.status === "pending" ? (
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      disabled={moderatingId === a.id}
                      onClick={() => moderateAnswer(a.id, "approveAnswer")}
                      className="px-3 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={moderatingId === a.id}
                      onClick={() => moderateAnswer(a.id, "rejectAnswer")}
                      className="px-3 py-1.5 text-xs border border-red-200 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Official answers</h2>
        {officialAnswers.length === 0 ? (
          <p className="text-sm text-gray-600 mb-4">No official answers yet.</p>
        ) : (
          <ul className="space-y-3 mb-6">
            {officialAnswers.map((a) => (
              <li key={a.id} className="p-4 bg-emerald-50/80 border border-emerald-100 rounded-lg text-sm text-gray-800 whitespace-pre-line">
                {a.content}
              </li>
            ))}
          </ul>
        )}
        <label className="block text-sm font-medium text-gray-900 mb-2">Add official answer</label>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-md mb-3"
          placeholder="Write answer as Balitrusted…"
        />
        <button
          type="button"
          onClick={submitAnswer}
          disabled={savingAnswer || !answerText.trim()}
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {savingAnswer ? "Saving…" : "Publish answer"}
        </button>
      </section>
    </div>
  );
}
