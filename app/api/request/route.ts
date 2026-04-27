import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sendToAdmin } from "@/lib/email";
import { MutationHttpError } from "@/lib/blobJsonOptimisticWrite";
import { getRequests, addRequest, updateRequest, type SiteRequest } from "@/lib/requestsData";

export const dynamic = "force-dynamic";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  "client-rent": "Client – help me find property",
  "client-other": "Client – other questions",
  owner: "Owner/agent – want to list property",
  specialist: "Specialist – legal, etc.",
  "catalog-feedback": "Catalog – no/few results feedback",
  "property-book": "Property – book / enquire (rent)",
  "property-info": "Property – request information",
  "property-buy": "Property – buy interest",
};

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("admin-auth")?.value === "true";
}

/** GET – list requests (admin only) */
export async function GET() {
  const startedAt = Date.now();
  if (!(await checkAuth())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await getRequests();
  if (process.env.DATA_MIGRATION_OBSERVABILITY === "1") {
    console.info("[requests] api_get_ok", {
      rows: requests.length,
      elapsedMs: Date.now() - startedAt,
    });
  }
  return NextResponse.json({ requests });
}

/** PATCH – update request status/comment (admin only) */
export async function PATCH(request: NextRequest) {
  const startedAt = Date.now();
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
    if (process.env.DATA_MIGRATION_OBSERVABILITY === "1") {
      console.info("[requests] api_patch_ok", {
        id,
        elapsedMs: Date.now() - startedAt,
      });
    }
    return NextResponse.json({ request: updated });
  } catch (error) {
    if (error instanceof MutationHttpError) {
      return error.response;
    }
    console.error("Request PATCH error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

/** POST – create request (public). Saves to storage and sends email to admin. */
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
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
      propertyId,
      propertyTitle,
      propertyUrl,
      desiredStart,
    } = body;

    const isCatalogFeedback = requestType === "catalog-feedback";
    const isPropertyLead =
      requestType === "property-book" ||
      requestType === "property-info" ||
      requestType === "property-buy";

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const emailTrim = typeof email === "string" ? email.trim() : "";
    const whatsappTrim = typeof whatsapp === "string" ? whatsapp.trim() : "";

    if (isPropertyLead) {
      if (!emailTrim && !whatsappTrim) {
        return NextResponse.json({ error: "Email or phone is required" }, { status: 400 });
      }
    } else if (!isCatalogFeedback && !emailTrim && !whatsappTrim) {
      return NextResponse.json(
        { error: "Email or WhatsApp is required" },
        { status: 400 }
      );
    }

    const id = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const siteRequest: SiteRequest = {
      id,
      requestType: requestType || "",
      name: String(name).trim(),
      email: isCatalogFeedback && !emailTrim ? "—" : emailTrim || "—",
      whatsapp: whatsappTrim || undefined,
      preferredContact: preferredContact || undefined,
      propertyType: propertyType || undefined,
      area: area || undefined,
      bedrooms: bedrooms || undefined,
      budget: budget || undefined,
      budgetPeriod: budgetPeriod || undefined,
      budgetCurrency: budgetCurrency || undefined,
      duration: Array.isArray(duration) ? duration : undefined,
      message: message?.trim() || undefined,
      propertyId: typeof propertyId === "string" && propertyId.trim() ? propertyId.trim() : undefined,
      propertyTitle: typeof propertyTitle === "string" && propertyTitle.trim() ? propertyTitle.trim() : undefined,
      propertyUrl: typeof propertyUrl === "string" && propertyUrl.trim() ? propertyUrl.trim() : undefined,
      desiredStart: typeof desiredStart === "string" && desiredStart.trim() ? desiredStart.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    await addRequest(siteRequest);

    const typeLabel = REQUEST_TYPE_LABELS[requestType] || requestType || "—";
    const lines: string[] = [
      `<p><strong>New request from the website</strong></p>`,
      `<p><strong>Type:</strong> ${typeLabel}</p>`,
      `<p><strong>Name:</strong> ${siteRequest.name}</p>`,
    ];
    if (siteRequest.email && siteRequest.email !== "—") {
      lines.push(`<p><strong>Email:</strong> <a href="mailto:${siteRequest.email}">${siteRequest.email}</a></p>`);
    } else {
      lines.push(`<p><strong>Email:</strong> —</p>`);
    }
    if (siteRequest.whatsapp) lines.push(`<p><strong>Phone / WhatsApp:</strong> ${siteRequest.whatsapp}</p>`);
    if (preferredContact) {
      lines.push(
        `<p><strong>Preferred contact:</strong> ${preferredContact === "whatsapp" ? "WhatsApp / phone" : "Email"}</p>`
      );
    }
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
    if (siteRequest.propertyId) lines.push(`<p><strong>Property ID:</strong> ${siteRequest.propertyId}</p>`);
    if (siteRequest.propertyTitle) lines.push(`<p><strong>Property:</strong> ${siteRequest.propertyTitle}</p>`);
    if (siteRequest.propertyUrl) {
      const u = siteRequest.propertyUrl.replace(/"/g, "&quot;");
      lines.push(`<p><strong>Property link:</strong> <a href="${u}">${u}</a></p>`);
    }
    if (siteRequest.desiredStart) lines.push(`<p><strong>Preferred start:</strong> ${siteRequest.desiredStart}</p>`);
    if (siteRequest.message) lines.push(`<p><strong>Message:</strong></p><p>${siteRequest.message.replace(/\n/g, "<br>")}</p>`);
    lines.push(`<p><em>Balitrusted</em></p>`);

    const subject = `[Balitrusted] New request: ${typeLabel} – ${siteRequest.name}`;
    void sendToAdmin(subject, lines.join("\n")).then((r) => {
      if (!r.success) console.error("Request email failed:", r.error);
    });

    if (process.env.DATA_MIGRATION_OBSERVABILITY === "1") {
      console.info("[requests] api_post_ok", {
        id,
        elapsedMs: Date.now() - startedAt,
      });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Request form error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
