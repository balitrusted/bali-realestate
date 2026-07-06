export type QaCategory = "rent" | "buy" | "services" | "living";

export type QaQuestionStatus = "draft" | "published" | "closed";

export type QaAuthorKind = "virtual" | "member" | "official";

export type QaAnswerStatus = "pending" | "approved" | "rejected";

export interface QaQuestion {
  id: string;
  slug: string;
  title: string;
  body?: string;
  category: QaCategory;
  status: QaQuestionStatus;
  authorKind: QaAuthorKind;
  authorDisplayName: string;
  /** Moderation only; never shown on public pages. */
  authorEmail?: string;
  authorUserId?: string;
  isSeeded: boolean;
  answerCount: number;
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  relatedServiceId?: string;
  relatedArea?: string;
}

export interface QaAnswer {
  id: string;
  questionId: string;
  parentId?: string;
  authorKind: QaAuthorKind;
  authorDisplayName: string;
  /** Moderation only; never shown on public pages. */
  authorEmail?: string;
  authorUserId?: string;
  isOfficial: boolean;
  content: string;
  status: QaAnswerStatus;
  upvotes: number;
  createdAt: string;
  updatedAt?: string;
}

/** Feed item for homepage ticker and /api/qa/recent */
export interface QaRecentItem {
  type: "question" | "answer";
  id: string;
  questionId: string;
  questionSlug: string;
  questionTitle: string;
  category: QaCategory;
  authorDisplayName: string;
  snippet: string;
  isOfficial?: boolean;
  at: string;
}

export interface QaQuestionWithAnswers extends QaQuestion {
  answers: QaAnswer[];
}
