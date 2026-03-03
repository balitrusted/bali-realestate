import { NextRequest, NextResponse } from "next/server";
import { Comment } from "@/types/article";

// Simple email notification using fetch to external service
// For production, you should use a proper email service like SendGrid, Mailgun, or Resend
export async function POST(request: NextRequest) {
  try {
    const { parentComment, replyComment } = await request.json();

    if (!parentComment || !replyComment) {
      return NextResponse.json({ error: "Missing comment data" }, { status: 400 });
    }

    // Get article title for email
    const { getArticles } = await import("@/lib/articlesData");
    const articles = await getArticles();
    const article = articles.find(a => a.id === parentComment.articleId);

    // Email content
    const subject = `New reply to your comment on "${article?.title || 'Article'}"`;
    const emailBody = `
Hello ${parentComment.authorName},

${replyComment.authorName} has replied to your comment:

Your comment:
${parentComment.content.substring(0, 200)}${parentComment.content.length > 200 ? '...' : ''}

Reply:
${replyComment.content}

View the full conversation:
${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/guides/${article?.category || 'ubud'}/${article?.slug || ''}

---
This is an automated notification from Bali Real Estate.
    `.trim();

    // For now, we'll log the email (you can integrate with email service later)
    console.log('=== EMAIL NOTIFICATION ===');
    console.log('To:', parentComment.authorEmail);
    console.log('Subject:', subject);
    console.log('Body:', emailBody);
    console.log('========================');

    // TODO: Integrate with email service
    // Example with Resend (uncomment and configure):
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'notifications@yourdomain.com',
      to: parentComment.authorEmail,
      subject: subject,
      html: emailBody.replace(/\n/g, '<br>'),
    });
    */

    // Example with SendGrid (uncomment and configure):
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({
      to: parentComment.authorEmail,
      from: 'notifications@yourdomain.com',
      subject: subject,
      text: emailBody,
    });
    */

    return NextResponse.json({ success: true, message: "Email notification logged" });
  } catch (error) {
    console.error("Error sending email notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
