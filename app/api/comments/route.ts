import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { Comment } from "@/types/article";
import { sendToAdmin } from "@/lib/email";
import { getArticles } from "@/lib/articlesData";

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

// GET - Get comments for an article (only approved)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");
    
    if (!articleId) {
      return NextResponse.json({ error: "articleId required" }, { status: 400 });
    }

    const { comments: allComments } = await import("@/data/comments");
    
    // Filter by article and only show approved
    const articleComments = allComments.filter(
      c => c.articleId === articleId && c.approved
    );
    
    // Build comment tree structure
    const commentMap = new Map<string, Comment & { replies?: Comment[] }>();
    const rootComments: (Comment & { replies?: Comment[] })[] = [];

    // First pass: create map and initialize replies array
    articleComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    articleComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          if (!parent.replies) parent.replies = [];
          parent.replies.push(commentWithReplies);
        } else {
          // Parent not found or not approved, treat as root
          rootComments.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    // Sort root comments by date (newest first)
    rootComments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Sort replies by date (oldest first for conversation flow)
    function sortReplies(comments: (Comment & { replies?: Comment[] })[]) {
      comments.forEach(comment => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          sortReplies(comment.replies);
        }
      });
    }
    sortReplies(rootComments);
    
    return NextResponse.json({ comments: rootComments });
  } catch (error) {
    console.error("Error reading comments:", error);
    return NextResponse.json({ comments: [] });
  }
}

// POST - Create new comment (public, requires moderation)
export async function POST(request: Request) {
  try {
    const commentData: any = await request.json();
    
    // Basic validation
    if (!commentData.articleId || !commentData.authorName || !commentData.authorEmail || !commentData.content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(commentData.authorEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { comments: existingComments } = await import("@/data/comments");
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      articleId: commentData.articleId,
      parentId: commentData.parentId,
      authorName: commentData.authorName.trim(),
      authorEmail: commentData.authorEmail.trim(),
      authorWebsite: commentData.authorWebsite?.trim(),
      content: commentData.content.trim(),
      approved: false, // Requires moderation
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      userVotes: {},
    };
    
    const updatedComments = [...existingComments, newComment];
    const newContent = generateCommentsFile(updatedComments);
    await writeFile(DATA_FILE, newContent, "utf-8");
    
    // Send email notification if this is a reply (to the comment author)
    if (commentData.parentId) {
      try {
        const parentComment = existingComments.find(c => c.id === commentData.parentId);
        if (parentComment && parentComment.authorEmail) {
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/comments/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              parentComment,
              replyComment: newComment,
            }),
          }).catch(err => console.error('Failed to send reply notification:', err));
        }
      } catch (err) {
        console.error('Error sending reply notification:', err);
      }
    }

    // Notify admin about new comment (for moderation)
    (async () => {
      try {
        const articles = await getArticles();
        const article = articles.find(a => a.id === newComment.articleId);
        const articleTitle = article?.title || "Article";
        const articleUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/guides/${article?.category || ""}/${article?.slug || ""}`;
        const subject = `[Balitrusted] New comment to moderate: "${articleTitle}"`;
        const html = `
          <p><strong>New comment (awaiting moderation)</strong></p>
          <p><strong>Article:</strong> ${articleTitle}</p>
          <p><strong>Author:</strong> ${newComment.authorName} &lt;${newComment.authorEmail}&gt;</p>
          <p><strong>Content:</strong></p>
          <p>${newComment.content.replace(/\n/g, "<br>")}</p>
          <p><a href="${articleUrl}">View article</a></p>
          <p><em>Balitrusted</em></p>
        `;
        await sendToAdmin(subject, html);
      } catch (err) {
        console.error('Failed to send admin comment notification:', err);
      }
    })();

    return NextResponse.json({ 
      comment: newComment,
      message: "Comment submitted. It will be visible after moderation."
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to submit comment" },
      { status: 500 }
    );
  }
}
