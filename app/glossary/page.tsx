import { Metadata } from "next";
import Link from "next/link";
import { getGlossaryTerms } from "@/lib/glossaryData";
import {
  GLOSSARY_CATEGORY_ORDER,
  glossaryCategoryLabel,
  glossaryIndexLetter,
} from "@/lib/glossaryHub";
import type { GlossaryCategory } from "@/types/glossary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";

export const metadata: Metadata = {
  title: "Bali real estate glossary — terms & concepts | Balitrusted",
  description:
    "Short, plain-English explanations of legal titles, permits, visas, and day-to-day villa topics for Bali long-term rent and buy.",
  alternates: { canonical: `${baseUrl}/glossary` },
};

export default async function GlossaryHubPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const catRaw = typeof sp.category === "string" ? sp.category : undefined;
  const categoryFilter =
    catRaw && GLOSSARY_CATEGORY_ORDER.includes(catRaw as GlossaryCategory)
      ? (catRaw as GlossaryCategory)
      : undefined;

  const allTerms = await getGlossaryTerms();
  const terms = categoryFilter ? allTerms.filter((t) => t.category === categoryFilter) : allTerms;

  const byLetter = new Map<string, typeof terms>();
  for (const t of terms) {
    const L = glossaryIndexLetter(t.title);
    if (!byLetter.has(L)) byLetter.set(L, []);
    byLetter.get(L)!.push(t);
  }
  const lettersSorted = [...byLetter.keys()].sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-12">
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Glossary</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Glossary</h1>
          <p className="mt-3 text-gray-600 leading-relaxed max-w-2xl">
            Quick definitions for titles, paperwork, and everyday villa topics in Bali. This is orientation, not legal
            advice—confirm details with a qualified professional for your case.
          </p>
        </header>

        <section className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/glossary"
            className={`rounded-full border px-3 py-1 text-sm ${!categoryFilter ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            All
          </Link>
          {GLOSSARY_CATEGORY_ORDER.map((c) => (
            <Link
              key={c}
              href={`/glossary?category=${c}`}
              className={`rounded-full border px-3 py-1 text-sm ${categoryFilter === c ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
            >
              {glossaryCategoryLabel(c)}
            </Link>
          ))}
        </section>

        {lettersSorted.length > 0 && (
          <nav aria-label="Alphabetical index" className="mb-10 flex flex-wrap gap-2 text-sm">
            {lettersSorted.map((L) => (
              <a
                key={L}
                href={`#letter-${L === "#" ? "hash" : L}`}
                className="text-emerald-800 hover:underline font-medium"
              >
                {L}
              </a>
            ))}
          </nav>
        )}

        <div className="space-y-12">
          {lettersSorted.map((L) => (
            <section key={L} id={`letter-${L === "#" ? "hash" : L}`} className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">{L}</h2>
              <ul className="space-y-6">
                {byLetter.get(L)!.map((t) => (
                  <li key={t.id}>
                    <Link href={`/glossary/${t.slug}`} className="text-lg font-medium text-emerald-900 hover:underline">
                      {t.title}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">{glossaryCategoryLabel(t.category)}</div>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{t.summary}</p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {terms.length === 0 && (
          <p className="text-gray-600">
            No terms in this category yet.{" "}
            <Link href="/glossary" className="text-emerald-800 underline">
              View all
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
