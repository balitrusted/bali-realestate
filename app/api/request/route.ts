import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendToAdmin } from "@/lib/email";
import { getRequests, addRequest, updateRequest, type SiteRequest } from "@/lib/requestsData";

export const dynamic = "force-dynamic";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  "client-rent": "Client – help me find property",
  "client-other": "Client – other questions",
  owner: "Owner/agent – want to list property",
  specialist: "Specialist – legal, etc.",
};

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

/** GET – list requests (admin only) */
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await getRequests();
  return NextResponse.json({ requests });
}

/** PATCH – update request status/comment (admin only) */
export async function PATCH(request: NextRequest) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { id, status, comment } = body;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const updated = await updateRequest(id, { status, comment });
    if (!updated) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Request PATCH error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** POST – create request (public). Saves to storage and sends email to admin. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requestType,
      name,
      email,
      whatsapp,
      preferredContact,
      propertyType,
      area,
      bedrooms,
      budget,
      budgetPeriod,
      budgetCurrency,
      duration,
      message,
    } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const siteRequest: SiteRequest = {
      id,
      requestType: requestType || "",
      name: String(name).trim(),
      email: String(email).trim(),
      whatsapp: whatsapp?.trim() || undefined,
      preferredContact: preferredContact || undefined,
      propertyType: propertyType || undefined,
      area: area || undefined,
      bedrooms: bedrooms || undefined,
      budget: budget || undefined,
      budgetPeriod: budgetPeriod || undefined,
      budgetCurrency: budgetCurrency || undefined,
      duration: Array.isArray(duration) ? duration : undefined,
      message: message?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await addRequest(siteRequest);

    const typeLabel = REQUEST_TYPE_LABELS[requestType] || requestType || "—";
    const lines: string[] = [
      `<p><strong>New request from the website</strong></p>`,
      `<p><strong>Type:</strong> ${typeLabel}</p>`,
      `<p><strong>Name:</strong> ${siteRequest.name}</p>`,
      `<p><strong>Email:</strong> <a href="mailto:${siteRequest.email}">${siteRequest.email}</a></p>`,
    ];
    if (siteRequest.whatsapp) lines.push(`<p><strong>WhatsApp:</strong> ${siteRequest.whatsapp}</p>`);
    lines.push(`<p><strong>Preferred contact:</strong> ${preferredContact === "whatsapp" ? "WhatsApp" : "Email"}</p>`);
    if (siteRequest.propertyType) lines.push(`<p><strong>Property type:</strong> ${siteRequest.propertyType}</p>`);
    if (siteRequest.area) lines.push(`<p><strong>Area:</strong> ${siteRequest.area}</p>`);
    if (siteRequest.bedrooms) lines.push(`<p><strong>Bedrooms:</strong> ${siteRequest.bedrooms}</p>`);
    if (siteRequest.budget) {
      const budgetStr = siteRequest.budgetCurrency && siteRequest.budgetPeriod
        ? `${siteRequest.budget} ${siteRequest.budgetCurrency}/${siteRequest.budgetPeriod}`
        : String(siteRequest.budget);
      lines.push(`<p><strong>Budget:</strong> ${budgetStr}</p>`);
    }
    if (siteRequest.duration?.length) lines.push(`<p><strong>Duration:</strong> ${siteRequest.duration.join(", ")}</p>`);
    if (siteRequest.message) lines.push(`<p><strong>Message:</strong></p><p>${siteRequest.message.replace(/\n/g, "<br>")}</p>`);
    lines.push(`<p><em>Balitrusted</em></p>`);

    const subject = `[Balitrusted] New request: ${typeLabel} – ${siteRequest.name}`;
    sendToAdmin(subject, lines.join("\n")).catch((err) => console.error("Request email failed:", err));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Request form error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
