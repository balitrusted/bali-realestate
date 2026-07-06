import Link from "next/link";
import type { QaQuestion } from "@/types/qa";
import { formatLocaleDate } from "@/lib/formatDate";
import { qaCategoryLabel } from "@/lib/qaHub";

interface QaQuestionCardProps {
  question: QaQuestion;
  showExcerpt?: boolean;
}

export default function QaQuestionCard({ question, showExcerpt = true }: QaQuestionCardProps) {
  return (
    <article className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors bg-white">
      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-gray-500">
        <span>{formatLocaleDate(question.publishedAt || question.createdAt)}</span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full font-medium">
          {qaCategoryLabel(question.category)}
        </span>
        {question.answerCount > 0 ? (
          <span className="text-emerald-800">
            {question.answerCount} {question.answerCount === 1 ? "answer" : "answers"}
          </span>
        ) : (
          <span className="text-amber-700">Awaiting answer</span>
        )}
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        <Link href={`/qa/${question.slug}`} className="hover:text-emerald-900">
          {question.title}
        </Link>
      </h2>
      {showExcerpt && question.body ? (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{question.body}</p>
      ) : null}
      <div className="text-xs text-gray-500">
        Asked by <span className="font-medium text-gray-700">{question.authorDisplayName}</span>
      </div>
    </article>
  );
}
