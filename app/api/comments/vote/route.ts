import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { Comment } from "@/types/article";

const DATA_FILE = join(process.cwd(), "data", "comments.ts");

// Generate comments file content
function generateCommentsFile(comments: Comment[]): string {
  const indent = "  ";
  let content = `import { Comment } from "@/types/article";\n\n`;
  content += `// Comments data\n`;
  content += `// This file is auto-generated. Manual edits may be overwritten.\n`;
  content += `export const comments: Comment[] = [\n`;

  comments.forEach((comment, index) => {
    content += `${indent}{\n`;
    content += `${indent}${indent}id: ${JSON.stringify(comment.id)},\n`;
    content += `${indent}${indent}articleId: ${JSON.stringify(comment.articleId)},\n`;
    if (comment.parentId) {
      content += `${indent}${indent}parentId: ${JSON.stringify(comment.parentId)},\n`;
    }
    content += `${indent}${indent}authorName: ${JSON.stringify(comment.authorName)},\n`;
    content += `${indent}${indent}authorEmail: ${JSON.stringify(comment.authorEmail)},\n`;
    if (comment.authorWebsite) {
      content += `${indent}${indent}authorWebsite: ${JSON.stringify(comment.authorWebsite)},\n`;
    }
    content += `${indent}${indent}content: ${JSON.stringify(comment.content)},\n`;
    content += `${indent}${indent}approved: ${comment.approved},\n`;
    content += `${indent}${indent}createdAt: ${JSON.stringify(comment.createdAt)},\n`;
    if (comment.updatedAt) {
      content += `${indent}${indent}updatedAt: ${JSON.stringify(comment.updatedAt)},\n`;
    }
    if (comment.upvotes !== undefined) {
      content += `${indent}${indent}upvotes: ${comment.upvotes},\n`;
    }
    if (comment.downvotes !== undefined) {
      content += `${indent}${indent}downvotes: ${comment.downvotes},\n`;
    }
    if (comment.userVotes && Object.keys(comment.userVotes).length > 0) {
      content += `${indent}${indent}userVotes: ${JSON.stringify(comment.userVotes)},\n`;
    }
    content += `${indent}}${index < comments.length - 1 ? "," : ""}\n`;
  });

  content += `];\n`;
  return content;
}

// POST - Vote on a comment
export async function POST(request: NextRequest) {
  try {
    const { commentId, voteType } = await request.json();
    
    if (!commentId || !voteType || !['up', 'down'].includes(voteType)) {
      return NextResponse.json(
        { error: "Invalid request. commentId and voteType (up/down) required." },
        { status: 400 }
      );
    }

    // Get user identifier (IP address for now, can be enhanced with user IDs later)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "anonymous";

    const { comments: allComments } = await import("@/data/comments");
    const commentIndex = allComments.findIndex(c => c.id === commentId);
    
    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const comment = allComments[commentIndex];
    const userVotes = comment.userVotes || {};
    const previousVote = userVotes[ip];

    // Initialize counts if not present
    let upvotes = comment.upvotes || 0;
    let downvotes = comment.downvotes || 0;

    // Handle vote changes
    if (previousVote === voteType) {
      // User is removing their vote
      if (voteType === 'up') {
        upvotes = Math.max(0, upvotes - 1);
      } else {
        downvotes = Math.max(0, downvotes - 1);
      }
      delete userVotes[ip];
    } else {
      // User is changing or adding a vote
      if (previousVote === 'up') {
        upvotes = Math.max(0, upvotes - 1);
      } else if (previousVote === 'down') {
        downvotes = Math.max(0, downvotes - 1);
      }

      if (voteType === 'up') {
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

    allComments[commentIndex] = updatedComment;
    const newContent = generateCommentsFile(allComments);
    await writeFile(DATA_FILE, newContent, "utf-8");

    return NextResponse.json({
      success: true,
      comment: updatedComment,
      userVote: userVotes[ip] || null,
    });
  } catch (error) {
    console.error("Error voting on comment:", error);
    return NextResponse.json(
      { error: "Failed to vote on comment" },
      { status: 500 }
    );
  }
}
