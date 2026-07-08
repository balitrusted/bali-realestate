import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequests } from "@/lib/requestsData";
import { getNotifyUnreadCount } from "@/lib/adminBadgeState";
import { getAllComments } from "@/lib/commentsPersistence";
import { countPendingQaModeration } from "@/lib/qaPersistence";
import { getQaScheduleReminderCount } from "@/lib/qaScheduleReminder";

export const dynamic = "force-dynamic";

function getCommentStatus(comment: {
  approved: boolean;
  moderationStatus?: "pending" | "approved" | "rejected";
}): "pending" | "approved" | "rejected" {
  if (comment.moderationStatus === "approved") return "approved";
  if (comment.moderationStatus === "rejected") return "rejected";
  if (comment.moderationStatus === "pending") return "pending";
  return comment.approved ? "approved" : "pending";
}

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin-auth")?.value !== "true") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comments = await getAllComments();
    const commentsPending = comments.filter((c) => getCommentStatus(c) === "pending").length;

    const siteRequests = await getRequests();
    const requestsNew = siteRequests.filter((r) => (r.status || "new") === "new").length;

    const notifySeenAtCookie = cookieStore.get("admin-notify-seen-at")?.value;
    const notifyNew = await getNotifyUnreadCount(notifySeenAtCookie);

    let qaPending = 0;
    try {
      const moderation = await countPendingQaModeration();
      const scheduleSeenDay = cookieStore.get("admin-qa-schedule-seen-day")?.value;
      const scheduleReminder = getQaScheduleReminderCount(scheduleSeenDay);
      qaPending = moderation + scheduleReminder;
    } catch {
      /* ignore */
    }

    return NextResponse.json({
      commentsPending,
      requestsNew,
      notifyNew,
      qaPending,
    });
  } catch (e) {
    console.error("badge-counts:", e);
    return NextResponse.json(
      { commentsPending: 0, requestsNew: 0, notifyNew: 0, qaPending: 0 },
      { status: 200 }
    );
  }
}
