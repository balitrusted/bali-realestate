import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequests } from "@/lib/requestsData";
import { getNotifyUnreadCount } from "@/lib/adminBadgeState";
import { getAllComments } from "@/lib/commentsPersistence";

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

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comments = await getAllComments();
    const commentsPending = comments.filter((c) => getCommentStatus(c) === "pending").length;

    const siteRequests = await getRequests();
    const requestsNew = siteRequests.filter((r) => (r.status || "new") === "new").length;

    const notifyNew = await getNotifyUnreadCount();

    return NextResponse.json({
      commentsPending,
      requestsNew,
      notifyNew,
    });
  } catch (e) {
    console.error("badge-counts:", e);
    return NextResponse.json(
      { commentsPending: 0, requestsNew: 0, notifyNew: 0 },
      { status: 200 }
    );
  }
}
