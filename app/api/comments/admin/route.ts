import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MutationHttpError } from "@/lib/blobJsonOptimisticWrite";
import { getAllComments, mutateCommentsWithRetry } from "@/lib/commentsPersistence";

// Check authentication
async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
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
    const { id, approved } = await request.json();

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

      return existingComments.map((c, i) =>
        i === index
          ? {
              ...c,
              approved: approved === true,
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await mutateCommentsWithRetry((existingComments) => {
      const filtered = existingComments.filter((c) => c.id !== id);
      if (filtered.length === existingComments.length) {
        throw new MutationHttpError(
          NextResponse.json({ error: "Comment not found" }, { status: 404 })
        );
      }
      return filtered;
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof MutationHttpError) {
      return error.response;
    }
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
