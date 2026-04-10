import { NextRequest, NextResponse } from "next/server";
import { getArticles } from "@/lib/articlesData";
import { getAllBlogPosts } from "@/lib/blogPostsPersistence";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { parentComment, replyComment } = await request.json();

    if (!parentComment || !replyComment) {
      return NextResponse.json({ error: "Missing comment data" }, { status: 400 });
    }

    let articleTitle = "Article";
    let articleUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    if (String(parentComment.articleId).startsWith("blog:")) {
      const blogId = String(parentComment.articleId).slice("blog:".length);
      const posts = await getAllBlogPosts();
      const post = posts.find((p) => p.id === blogId);
      articleTitle = post?.title || "Blog post";
      articleUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/blog/${post?.slug || ""}`;
    } else {
      const articles = await getArticles();
      const article = articles.find((a) => a.id === parentComment.articleId);
      articleTitle = article?.title || "Article";
      articleUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/guides/${article?.category || "ubud"}/${article?.slug || ""}`;
    }

    const subject = `New reply to your comment on "${articleTitle}"`;
    const textBody = `
Hello ${parentComment.authorName},

${replyComment.authorName} has replied to your comment:

Your comment:
${parentComment.content.substring(0, 200)}${parentComment.content.length > 200 ? "..." : ""}

Reply:
${replyComment.content}

View the full conversation:
${articleUrl}

---
This is an automated notification from Balitrusted.
    `.trim();
    const htmlBody = textBody.replace(/\n/g, "<br>");

    const result = await sendEmail({
      to: parentComment.authorEmail,
      subject,
      html: htmlBody,
      text: textBody,
    });

    if (!result.success) {
      console.error("Comment notify email failed:", result.error);
      return NextResponse.json(
        { error: "Failed to send notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending comment notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
