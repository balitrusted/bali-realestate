import { NextResponse } from "next/server";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { cookies } from "next/headers";
import { sendToAdmin } from "@/lib/email";

const DATA_FILE = join(process.cwd(), "data", "notify-requests.json");

export interface NotifyRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  name: string;
  email: string;
  dateFrom?: string;
  createdAt: string;
}

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

async function readRequests(): Promise<NotifyRequest[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeRequests(requests: NotifyRequest[]) {
  await writeFile(DATA_FILE, JSON.stringify(requests, null, 2), "utf-8");
}

// GET - List all (admin only)
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await readRequests();
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
    const requests = await readRequests();
    const newRequest: NotifyRequest = {
      id: `nr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      propertyId: String(propertyId),
      propertyTitle: String(propertyTitle || ""),
      name: String(name).trim(),
      email: String(email).trim(),
      dateFrom: dateFrom ? String(dateFrom).trim() : undefined,
      createdAt: new Date().toISOString(),
    };
    requests.push(newRequest);

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
    sendToAdmin(subject, html).catch((err) => console.error("Notify-request email failed:", err));

    try {
      await writeRequests(requests);
    } catch (writeErr) {
      console.error("Could not save notify-requests (e.g. on Vercel):", writeErr);
      // Still return success – admin got the email
    }
    return NextResponse.json({ success: true, id: newRequest.id });
  } catch (error) {
    console.error("Notify request error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
