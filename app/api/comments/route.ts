import { NextResponse } from "next/server";
import { Comment } from "@/types/article";
import { sendToAdmin } from "@/lib/email";
import { getArticles } from "@/lib/articlesData";
import { getAllBlogPosts } from "@/lib/blogPostsPersistence";
import { getAllComments, mutateCommentsWithRetry } from "@/lib/commentsPersistence";

// GET - Get comments for an article (only approved)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json({ error: "articleId required" }, { status: 400 });
    }

    const allComments = await getAllComments();

    // Filter by article and only show approved
    const articleComments = allComments.filter((c) => c.articleId === articleId && c.approved);

    // Build comment tree structure
    const commentMap = new Map<string, Comment & { replies?: Comment[] }>();
    const rootComments: (Comment & { replies?: Comment[] })[] = [];

    // First pass: create map and initialize replies array
    articleComments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    // Second pass: build tree
    articleComments.forEach((comment) => {
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
    rootComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Sort replies by date (oldest first for conversation flow)
    function sortReplies(comments: (Comment & { replies?: Comment[] })[]) {
      comments.forEach((comment) => {
        if (comment.replies && comment.replies.length > 0) {
          comment.replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(commentData.authorEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      articleId: commentData.articleId,
      parentId: commentData.parentId,
      authorName: commentData.authorName.trim(),
      authorEmail: commentData.authorEmail.trim(),
      authorWebsite: commentData.authorWebsite?.trim(),
      content: commentData.content.trim(),
      approved: false, // Requires moderation
      moderationStatus: "pending",
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      userVotes: {},
    };

    let parentComment: Comment | undefined;
    await mutateCommentsWithRetry(async (existingComments) => {
      if (commentData.parentId) {
        parentComment = existingComments.find((c) => c.id === commentData.parentId);
      }
      return [...existingComments, newComment];
    });

    // Send email notification if this is a reply (to the comment author)
    if (commentData.parentId) {
      try {
        if (parentComment?.authorEmail) {
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/comments/notify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parentComment,
              replyComment: newComment,
            }),
          }).catch((err) => console.error("Failed to send reply notification:", err));
        }
      } catch (err) {
        console.error("Error sending reply notification:", err);
      }
    }

    // Notify admin about new comment (for moderation)
    (async () => {
      try {
        let articleTitle = "Article";
        let articleUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        if (String(newComment.articleId).startsWith("blog:")) {
          const blogId = String(newComment.articleId).slice("blog:".length);
          const posts = await getAllBlogPosts();
          const post = posts.find((p) => p.id === blogId);
          articleTitle = post?.title || "Blog post";
          articleUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/blog/${post?.slug || ""}`;
        } else {
          const articles = await getArticles();
          const article = articles.find((a) => a.id === newComment.articleId);
          articleTitle = article?.title || "Article";
          articleUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/guides/${article?.category || ""}/${article?.slug || ""}`;
        }

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
        console.error("Failed to send admin comment notification:", err);
      }
    })();

    return NextResponse.json({
      comment: newComment,
      message: "Comment submitted. It will be visible after moderation.",
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to submit comment" }, { status: 500 });
  }
}
