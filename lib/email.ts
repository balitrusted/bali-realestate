import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/** From address: use your verified domain later, or Resend's default for testing */
const FROM_EMAIL = process.env.EMAIL_FROM || "Balitrusted <onboarding@resend.dev>";

/** Where to send admin notifications (new requests, notify-me, new comments) */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.NOTIFICATION_EMAIL || "";

export function canSendEmail(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Send email to a single recipient (e.g. user notification).
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set, email not sent:", params.subject);
    return { success: false, error: "Email not configured" };
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: String(error.message) };
    }
    return { success: true };
  } catch (err) {
    console.error("Send email error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Send notification to admin (new request, notify-me, new comment digest).
 */
export async function sendToAdmin(subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  if (!ADMIN_EMAIL) {
    console.warn("ADMIN_EMAIL not set, admin notification not sent:", subject);
    return { success: false, error: "Admin email not configured" };
  }
  const result = await sendEmail({ to: ADMIN_EMAIL, subject, html });
  if (!result.success) {
    console.error("[email] sendToAdmin failed:", result.error ?? "unknown", "| to:", ADMIN_EMAIL, "| subject:", subject);
  }
  return result;
}
