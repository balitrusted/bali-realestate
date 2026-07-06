import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import QaAnswerBlock from "@/components/QaAnswerBlock";
import QaAskForm from "@/components/QaAskForm";
import QaQuestionCard from "@/components/QaQuestionCard";
import QaReplyForm from "@/components/QaReplyForm";
import { getPublishedQuestions, getQuestionWithAnswers } from "@/lib/qaPersistence";
import {
  QA_CATEGORY_ORDER,
  QA_RESERVED_SLUGS,
  qaCategoryDescription,
  qaCategoryLabel,
} from "@/lib/qaHub";
import { formatLocaleDate } from "@/lib/formatDate";
import type { QaCategory } from "@/types/qa";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://balitrusted.com";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (QA_RESERVED_SLUGS.has(slug)) {
    const cat = slug as QaCategory;
    return {
      title: `${qaCategoryLabel(cat)} Q&A | Balitrusted`,
      description: qaCategoryDescription(cat),
      alternates: { canonical: `${baseUrl}/qa/${slug}` },
    };
  }
  const data = await getQuestionWithAnswers(slug);
  if (!data) return { title: "Question not found" };
  const title = data.seoTitle || data.title;
  const description =
    data.seoDescription ||
    data.body?.slice(0, 160) ||
    `Answers about ${data.title} — Bali property Q&A.`;
  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/qa/${data.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${baseUrl}/qa/${data.slug}`,
    },
  };
}

function CategoryPage({ category }: { category: QaCategory }) {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/qa" className="hover:text-gray-900">
              Q&amp;A
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{qaCategoryLabel(category)}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{qaCategoryLabel(category)}</h1>
          <p className="text-gray-600 mb-6">{qaCategoryDescription(category)}</p>
          <QaAskForm defaultCategory={category} className="mb-8" />
          <CategoryQuestionList category={category} />
        </div>
      </div>
    </div>
  );
}

async function CategoryQuestionList({ category }: { category: QaCategory }) {
  const questions = await getPublishedQuestions(category);
  return questions.length === 0 ? (
    <p className="text-gray-600">No questions in this category yet.</p>
  ) : (
    <div className="space-y-4">
      {questions.map((q) => (
        <QaQuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
}

async function QuestionPage({ slug }: { slug: string }) {
  const data = await getQuestionWithAnswers(slug);
  if (!data) notFound();

  const officialAnswer = data.answers.find((a) => a.isOfficial);
  const otherAnswers = data.answers.filter((a) => !a.isOfficial);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: data.title,
      text: data.body || data.title,
      dateCreated: data.createdAt,
      author: {
        "@type": "Person",
        name: data.authorDisplayName,
      },
      answerCount: data.answers.length,
      ...(officialAnswer
        ? {
            acceptedAnswer: {
              "@type": "Answer",
              text: officialAnswer.content,
              dateCreated: officialAnswer.createdAt,
              author: {
                "@type": "Organization",
                name: officialAnswer.authorDisplayName,
              },
              upvoteCount: officialAnswer.upvotes,
            },
          }
        : {}),
      suggestedAnswer: data.answers
        .filter((a) => a.id !== officialAnswer?.id)
        .map((a) => ({
          "@type": "Answer",
          text: a.content,
          dateCreated: a.createdAt,
          author: { "@type": "Person", name: a.authorDisplayName },
          upvoteCount: a.upvotes,
        })),
    },
  };

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <nav className="text-sm text-gray-600 mb-6">
            <Link href="/qa" className="hover:text-gray-900">
              Q&amp;A
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/qa/${data.category}`} className="hover:text-gray-900">
              {qaCategoryLabel(data.category)}
            </Link>
          </nav>

          <article>
            <div className="flex flex-wrap gap-2 mb-4 text-xs">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">
                {qaCategoryLabel(data.category)}
              </span>
              <span className="text-gray-500">
                {formatLocaleDate(data.publishedAt || data.createdAt)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h1>
            {data.body ? (
              <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-line">{data.body}</p>
            ) : null}
            <p className="text-sm text-gray-500 mb-8">
              Asked by <span className="font-medium text-gray-700">{data.authorDisplayName}</span>
            </p>

            {data.answers.length === 0 ? (
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-lg text-amber-900 text-sm">
                No answer yet. Check back soon or browse{" "}
                <Link href="/properties/rent/ubud" className="underline font-medium">
                  Ubud rentals
                </Link>
                .
              </div>
            ) : (
              <div className="space-y-6">
                {officialAnswer ? (
                  <QaAnswerBlock answer={officialAnswer} variant="official" />
                ) : null}
                {otherAnswers.map((a) => (
                  <QaAnswerBlock key={a.id} answer={a} />
                ))}
              </div>
            )}
          </article>

          <QaReplyForm questionId={data.id} />

          <aside className="mt-10 pt-8 border-t border-gray-200 space-y-3 text-sm">
            {data.relatedArea === "ubud" ? (
              <p>
                <Link href="/properties/rent/ubud" className="text-emerald-800 font-medium underline">
                  Browse villas for rent in Ubud
                </Link>
              </p>
            ) : null}
            {data.category === "services" || data.relatedServiceId ? (
              <p>
                <Link href="/services" className="text-emerald-800 font-medium underline">
                  Balitrusted services &amp; pricing
                </Link>
              </p>
            ) : null}
            <p>
              <Link href={`/qa/${data.category}`} className="text-gray-700 underline">
                More {qaCategoryLabel(data.category).toLowerCase()} questions
              </Link>
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default async function QaSlugPage({ params }: Props) {
  const { slug } = await params;
  if (QA_RESERVED_SLUGS.has(slug)) {
    return <CategoryPage category={slug as QaCategory} />;
  }
  return <QuestionPage slug={slug} />;
}

export async function generateStaticParams() {
  const questions = await getPublishedQuestions();
  const slugs = [
    ...QA_CATEGORY_ORDER.map((c) => ({ slug: c })),
    ...questions.map((q) => ({ slug: q.slug })),
  ];
  return slugs;
}
