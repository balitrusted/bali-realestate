import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendToAdmin } from "@/lib/email";
import {
  addNotifyRequest,
  getNotifyRequests,
  type NotifyRequest,
} from "@/lib/notifyRequestsData";

export type { NotifyRequest };

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

// GET - List all (admin only)
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await getNotifyRequests();
  return NextResponse.json({ requests });
}

// POST - Create (public)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, propertyTitle, name, email, dateFrom } = body;
    if (!propertyId || !name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }
    const newRequest: NotifyRequest = {
      id: `nr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      propertyId: String(propertyId),
      propertyTitle: String(propertyTitle || ""),
      name: String(name).trim(),
      email: String(email).trim(),
      dateFrom: dateFrom ? String(dateFrom).trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    // Email admin about new "notify when available" request
    const subject = `[Balitrusted] Notify when available: ${newRequest.propertyTitle || newRequest.propertyId}`;
    const html = `
      <p><strong>New request: notify when villa is available</strong></p>
      <ul>
        <li>Property: ${newRequest.propertyTitle || newRequest.propertyId} (ID: ${newRequest.propertyId})</li>
        <li>Name: ${newRequest.name}</li>
        <li>Email: <a href="mailto:${newRequest.email}">${newRequest.email}</a></li>
        ${newRequest.dateFrom ? `<li>Needed from: ${newRequest.dateFrom}</li>` : ""}
      </ul>
      <p><em>Balitrusted</em></p>
    `;
    void sendToAdmin(subject, html).then((r) => {
      if (!r.success) console.error("Notify-request email failed:", r.error);
    });

    await addNotifyRequest(newRequest);
    return NextResponse.json({ success: true, id: newRequest.id });
  } catch (error) {
    console.error("Notify request error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
