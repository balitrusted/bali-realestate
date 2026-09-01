/** Legacy scheduler hooks — must not appear in new or fixed content. */
export const GENERIC_QA_BODY_PHRASES = [
  "Anyone dealt with this around Ubud lately?",
  "Trying to plan ahead and not sure what's realistic.",
  "Would love to hear what others did in a similar situation.",
  "Google gives mixed answers so asking here.",
] as const;

const GENERIC_SET = new Set(
  GENERIC_QA_BODY_PHRASES.map((p) => p.trim().toLowerCase())
);

export function isGenericQaBody(body: string | undefined | null): boolean {
  if (!body?.trim()) return true;
  return GENERIC_SET.has(body.trim().toLowerCase());
}

export function normalizeQaBody(body: string | undefined | null): string {
  return (body ?? "").trim().toLowerCase();
}
