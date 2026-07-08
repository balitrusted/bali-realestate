/** Bali time — publication reminder days for Q&A content pipeline. */
export const QA_SCHEDULE_REMINDER_TIMEZONE = "Asia/Makassar";

const REMINDER_WEEKDAYS = new Set(["Mon", "Thu"]);

export function qaScheduleDayKey(date = new Date(), timeZone = QA_SCHEDULE_REMINDER_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isQaScheduleReminderDay(
  date = new Date(),
  timeZone = QA_SCHEDULE_REMINDER_TIMEZONE
): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return REMINDER_WEEKDAYS.has(weekday);
}

/** 1 on Mon/Thu (Bali) until admin opens the content pipeline that day. */
export function getQaScheduleReminderCount(seenDayKey?: string | null, now = new Date()): number {
  if (!isQaScheduleReminderDay(now)) return 0;
  const todayKey = qaScheduleDayKey(now);
  if (seenDayKey === todayKey) return 0;
  return 1;
}
