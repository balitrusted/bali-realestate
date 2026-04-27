import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MutationHttpError } from "@/lib/blobJsonOptimisticWrite";
import { getAllComments, mutateCommentsWithRetry } from "@/lib/commentsPersistence";

// Check authentication
async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

function normalizeModerationStatus(input: {
  approved?: boolean;
  moderationStatus?: unknown;
}): "pending" | "approved" | "rejected" {
  if (input.moderationStatus === "approved") return "approved";
  if (input.moderationStatus === "rejected") return "rejected";
  if (input.moderationStatus === "pending") return "pending";
  if (input.approved === true) return "approved";
  return "pending";
}

// GET - Get all comments (admin only)
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const comments = await getAllComments();
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error reading comments:", error);
    return NextResponse.json({ comments: [] });
  }
}

// PUT - Approve/reject comment
export async function PUT(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, approved, moderationStatus } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await mutateCommentsWithRetry((existingComments) => {
      const index = existingComments.findIndex((c) => c.id === id);

      if (index === -1) {
        throw new MutationHttpError(
          NextResponse.json({ error: "Comment not found" }, { status: 404 })
        );
      }

      const nextStatus = normalizeModerationStatus({ approved, moderationStatus });
      return existingComments.map((c, i) =>
        i === index
          ? {
              ...c,
              approved: nextStatus === "approved",
              moderationStatus: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : c
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MutationHttpError) {
      return error.response;
    }
    console.error("Error updating comment:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

// DELETE - Delete comment
export async function DELETE(request: Request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const idFromQuery = url.searchParams.get("id");
    let ids: string[] = [];
    try {
      const body = (await request.json()) as { ids?: unknown };
      if (Array.isArray(body.ids)) {
        ids = body.ids.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
      }
    } catch {
      // no body, fallback to query param
    }
    if (ids.length === 0 && idFromQuery) {
      ids = [idFromQuery];
    }
    if (ids.length === 0) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    const idSet = new Set(ids);

    await mutateCommentsWithRetry((existingComments) => {
      const existingIds = new Set(existingComments.map((c) => c.id));
      const missingId = ids.find((id) => !existingIds.has(id));
      if (missingId) {
        throw new MutationHttpError(
          NextResponse.json({ error: `Comment not found: ${missingId}` }, { status: 404 })
        );
      }

      const notRejected = existingComments.find((c) => {
        if (!idSet.has(c.id)) return false;
        const status = normalizeModerationStatus(c);
        return status !== "rejected";
      });
      if (notRejected) {
        throw new MutationHttpError(
          NextResponse.json(
            { error: "Only comments in Rejected can be permanently deleted" },
            { status: 400 }
          )
        );
      }

      return existingComments.filter((c) => !idSet.has(c.id));
    });

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    if (error instanceof MutationHttpError) {
      return error.response;
    }
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
