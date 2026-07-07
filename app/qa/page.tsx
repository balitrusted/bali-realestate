import type { Metadata } from "next";
import Link from "next/link";
import QaAskForm from "@/components/QaAskForm";
import QaQuestionCard from "@/components/QaQuestionCard";
import { getPublishedQuestions } from "@/lib/qaPersistence";
import { QA_CATEGORY_ORDER, qaCategoryDescription, qaCategoryLabel } from "@/lib/qaHub";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Q&A — Bali Villas, Rent & Relocation Questions",
  description:
    "Real questions about renting villas in Ubud, buying property, visas, and Balitrusted services. Search-friendly answers from people planning a move to Bali.",
};

export default async function QaHubPage() {
  const questions = await getPublishedQuestions();

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10">
            <nav className="text-sm text-gray-600 mb-6" aria-hidden="true">
              <span className="invisible">Q&amp;A / All</span>
            </nav>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Q&amp;A</h1>
            <p className="text-lg text-gray-600 mb-2">
              Questions from people planning long-term stays, villa rentals, and moves to Bali.
              Answers from Balitrusted and the community.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Showing <span className="font-medium text-gray-700">all</span> questions.
            </p>
            <QaAskForm className="mb-6" />
            <div className="flex flex-wrap gap-2">
              <Link
                href="/qa"
                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-900 text-white"
              >
                All
              </Link>
              {QA_CATEGORY_ORDER.map((cat) => (
                <Link
                  key={cat}
                  href={`/qa/${cat}`}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {qaCategoryLabel(cat)}
                </Link>
              ))}
            </div>
          </header>

          <section className="mb-12 grid sm:grid-cols-2 gap-4">
            {QA_CATEGORY_ORDER.map((cat) => {
              const count = questions.filter((q) => q.category === cat).length;
              return (
                <Link
                  key={cat}
                  href={`/qa/${cat}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors"
                >
                  <h2 className="font-semibold text-gray-900">{qaCategoryLabel(cat)}</h2>
                  <p className="text-sm text-gray-600 mt-1">{qaCategoryDescription(cat)}</p>
                  <p className="text-xs text-emerald-800 mt-2 font-medium">{count} questions</p>
                </Link>
              );
            })}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest questions</h2>
            {questions.length === 0 ? (
              <p className="text-gray-600">No published questions yet.</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <QaQuestionCard key={q.id} question={q} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-12 text-center">
            <QaAskForm />
          </section>
        </div>
      </div>
    </div>
  );
}
