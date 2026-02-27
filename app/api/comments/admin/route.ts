import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { Comment } from "@/types/article";

const DATA_FILE = join(process.cwd(), "data", "comments.ts");

// Check authentication
async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

// Generate comments file content (same as in route.ts)
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

// GET - Get all comments (admin only)
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { comments } = await import("@/data/comments");
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

    const { comments: existingComments } = await import("@/data/comments");
    const index = existingComments.findIndex(c => c.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    existingComments[index] = {
      ...existingComments[index],
      approved: approved === true,
      updatedAt: new Date().toISOString(),
    };

    const newContent = generateCommentsFile(existingComments);
    await writeFile(DATA_FILE, newContent, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
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

    const { comments: existingComments } = await import("@/data/comments");
    const filtered = existingComments.filter(c => c.id !== id);

    const newContent = generateCommentsFile(filtered);
    await writeFile(DATA_FILE, newContent, "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
