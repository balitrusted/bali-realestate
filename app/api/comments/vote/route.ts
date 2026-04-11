import { NextRequest, NextResponse } from "next/server";
import { Comment } from "@/types/article";
import { MutationHttpError } from "@/lib/blobJsonOptimisticWrite";
import { mutateCommentsWithRetry } from "@/lib/commentsPersistence";

// POST - Vote on a comment
export async function POST(request: NextRequest) {
  try {
    const { commentId, voteType } = await request.json();

    if (!commentId || !voteType || !["up", "down"].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid request. commentId and voteType (up/down) required." },
        { status: 400 }
      );
    }

    // Get user identifier (IP address for now, can be enhanced with user IDs later)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "anonymous";

    let updatedComment!: Comment;
    let userVoteOut: "up" | "down" | null = null;

    await mutateCommentsWithRetry((allComments) => {
      const commentIndex = allComments.findIndex((c) => c.id === commentId);

      if (commentIndex === -1) {
        throw new MutationHttpError(
          NextResponse.json({ error: "Comment not found" }, { status: 404 })
        );
      }

      const comment = allComments[commentIndex];
      const userVotes = { ...(comment.userVotes || {}) };
      const previousVote = userVotes[ip];

      let upvotes = comment.upvotes || 0;
      let downvotes = comment.downvotes || 0;

      if (previousVote === voteType) {
        if (voteType === "up") {
          upvotes = Math.max(0, upvotes - 1);
        } else {
          downvotes = Math.max(0, downvotes - 1);
        }
        delete userVotes[ip];
      } else {
        if (previousVote === "up") {
          upvotes = Math.max(0, upvotes - 1);
        } else if (previousVote === "down") {
          downvotes = Math.max(0, downvotes - 1);
        }

        if (voteType === "up") {
          upvotes += 1;
        } else {
          downvotes += 1;
        }
        userVotes[ip] = voteType;
      }

      updatedComment = {
        ...comment,
        upvotes,
        downvotes,
        userVotes,
        updatedAt: new Date().toISOString(),
      };

      userVoteOut = userVotes[ip] || null;

      return allComments.map((c, i) => (i === commentIndex ? updatedComment : c));
    });

    return NextResponse.json({
      success: true,
      comment: updatedComment,
      userVote: userVoteOut,
    });
  } catch (error) {
    if (error instanceof MutationHttpError) {
      return error.response;
    }
    console.error("Error voting on comment:", error);
    return NextResponse.json({ error: "Failed to vote on comment" }, { status: 500 });
  }
}
