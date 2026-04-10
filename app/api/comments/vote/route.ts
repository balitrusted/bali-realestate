import { NextRequest, NextResponse } from "next/server";
import { Comment } from "@/types/article";
import { getAllComments, persistComments } from "@/lib/commentsPersistence";

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

    const allComments = await getAllComments();
    const commentIndex = allComments.findIndex((c) => c.id === commentId);

    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const comment = allComments[commentIndex];
    const userVotes = { ...(comment.userVotes || {}) };
    const previousVote = userVotes[ip];

    // Initialize counts if not present
    let upvotes = comment.upvotes || 0;
    let downvotes = comment.downvotes || 0;

    // Handle vote changes
    if (previousVote === voteType) {
      // User is removing their vote
      if (voteType === "up") {
        upvotes = Math.max(0, upvotes - 1);
      } else {
        downvotes = Math.max(0, downvotes - 1);
      }
      delete userVotes[ip];
    } else {
      // User is changing or adding a vote
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

    // Update comment
    const updatedComment: Comment = {
      ...comment,
      upvotes,
      downvotes,
      userVotes,
      updatedAt: new Date().toISOString(),
    };

    const next = allComments.map((c, i) => (i === commentIndex ? updatedComment : c));
    await persistComments(next);

    return NextResponse.json({
      success: true,
      comment: updatedComment,
      userVote: userVotes[ip] || null,
    });
  } catch (error) {
    console.error("Error voting on comment:", error);
    return NextResponse.json({ error: "Failed to vote on comment" }, { status: 500 });
  }
}
