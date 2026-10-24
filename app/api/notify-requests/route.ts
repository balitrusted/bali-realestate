import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isValidAdminSession } from "@/lib/auth";
import { sendEmail, sendToAdmin } from "@/lib/email";
import {
  addNotifyRequest,
  getNotifyRequests,
  type NotifyRequest,
} from "@/lib/notifyRequestsData";
import { loadAllPropertiesIncludingArchived } from "@/lib/propertiesCatalog";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { getPropertyDisplayTitle } from "@/lib/propertyUtils";
import { isValidEnglishIsoDate } from "@/lib/englishDateInput";
import { areas, subAreaNames } from "@/types/areas";
import type { Property } from "@/types/property";

export type { NotifyRequest };

async function checkAuth() {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get("admin-auth")?.value);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formatPropertyPrice(property: Property): string | null {
  const price = property.price;
  const isForSale = property.types.includes("sale") && price.forSale != null;
  const amount = isForSale ? price.forSale : price.monthly ?? price.yearly ?? price.min;
  if (amount == null || amount <= 0) return null;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(amount);
  const period = isForSale ? "for sale" : price.monthly != null ? "per month" : price.yearly != null ? "per year" : "";
  return [formatted, period].filter(Boolean).join(" ");
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
    const propertyId = typeof body.propertyId === "string" ? body.propertyId.trim() : "";
    const name = (typeof body.name === "string" ? body.name.trim() : "") || "Subscriber";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const dateFrom = typeof body.dateFrom === "string" ? body.dateFrom.trim() : "";
    if (!propertyId || !email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    if (dateFrom && !isValidEnglishIsoDate(dateFrom)) {
      return NextResponse.json({ error: "Enter a valid requested date" }, { status: 400 });
    }

    const properties = await loadAllPropertiesIncludingArchived();
    const property = properties.find((candidate) => String(candidate.id) === propertyId);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const existing = await getNotifyRequests();
    if (existing.some((r) => r.propertyId === propertyId && r.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ success: true, alreadySubscribed: true, confirmationSent: true });
    }

    const propertyTitle = getPropertyDisplayTitle(property);
    const areaName = areas[property.mainArea]?.nameEn ?? property.mainArea;
    const subAreaName = property.subArea ? subAreaNames[property.subArea] ?? property.subArea : null;
    const location = [areaName, subAreaName].filter(Boolean).join(" · ");
    const siteBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/$/, "");
    const propertyUrl = `${siteBaseUrl}${buildPropertySlugIndex(properties).pathFor(property)}`;
    const subscriptionId = randomUUID();
    const unsubscribeUrl = `${siteBaseUrl}/unsubscribe/notify?token=${encodeURIComponent(subscriptionId)}`;
    const newRequest: NotifyRequest = {
      id: subscriptionId,
      propertyId,
      propertyTitle,
      name,
      email,
      dateFrom: dateFrom || undefined,
      createdAt: new Date().toISOString(),
    };

    await addNotifyRequest(newRequest);

    const safeName = escapeHtml(name);
    const safeTitle = escapeHtml(propertyTitle);
    const safeLocation = escapeHtml(location);
    const safeEmail = escapeHtml(email);
    const safePropertyUrl = escapeHtml(propertyUrl);
    const safeUnsubscribeUrl = escapeHtml(unsubscribeUrl);
    const safeDateFrom = dateFrom ? escapeHtml(dateFrom) : "Not specified";
    const priceLabel = formatPropertyPrice(property);
    const priceLine = priceLabel ? `<li><strong>Price:</strong> ${escapeHtml(priceLabel)}</li>` : "";
    const bedroomsLine = property.bedrooms > 0
      ? `<li><strong>Bedrooms:</strong> ${property.bedrooms}</li>`
      : "";
    const confirmation = await sendEmail({
      to: email,
      subject: `Subscription confirmed: ${propertyTitle.replace(/[\r\n]/g, " ")}`,
      text: `Hi ${name},\n\nYou are subscribed to updates for ${propertyTitle}: price changes, availability and listing changes.\nLocation: ${location}\n${priceLabel ? `Price: ${priceLabel}\n` : ""}${dateFrom ? `Needed from: ${dateFrom}\n` : ""}\nView the property: ${propertyUrl}\n\nTo stop these updates, visit: ${unsubscribeUrl}`,
      html: `
        <h1>Subscription confirmed</h1>
        <p>Hi ${safeName},</p>
        <p>You are subscribed to updates for this property (price changes, availability and listing changes):</p>
        <ul>
          <li><strong>Property:</strong> <a href="${safePropertyUrl}">${safeTitle}</a></li>
          <li><strong>Location:</strong> ${safeLocation}</li>
          ${bedroomsLine}
          ${priceLine}
          <li><strong>Needed from:</strong> ${safeDateFrom}</li>
        </ul>
        <p>We will email you when the price changes, the villa becomes available again, or its details are updated.</p>
        <p><a href="${safePropertyUrl}">View property details</a></p>
        <hr />
        <p style="font-size:12px;color:#6b7280">No longer interested in updates for this property?</p>
        <p><a href="${safeUnsubscribeUrl}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#f3f4f6;color:#374151;text-decoration:none;font-weight:600">Unsubscribe</a></p>
        <p>${escapeHtml(siteBaseUrl)} · Balitrusted</p>
      `,
    });

    const adminPageUrl = `${siteBaseUrl}/admin/notify-requests`;
    const adminSubject = `[Balitrusted] New availability subscription: ${propertyTitle.replace(/[\r\n]/g, " ")}`;
    const adminEmail = await sendToAdmin(adminSubject, `
      <h2>New villa availability subscription</h2>
      <ul>
        <li><strong>Property:</strong> <a href="${safePropertyUrl}">${safeTitle}</a> (ID: ${escapeHtml(propertyId)})</li>
        <li><strong>Location:</strong> ${safeLocation}</li>
        ${bedroomsLine}
        ${priceLine}
        <li><strong>Name:</strong> ${safeName}</li>
        <li><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></li>
        <li><strong>Needed from:</strong> ${safeDateFrom}</li>
      </ul>
      <p><a href="${escapeHtml(adminPageUrl)}">Open availability subscribers</a></p>
    `);

    if (!confirmation.success) {
      console.error("Notify-request confirmation email failed:", confirmation.error);
    }
    if (!adminEmail.success) {
      console.error("Notify-request admin email failed:", adminEmail.error);
    }

    return NextResponse.json({ success: true, id: newRequest.id, confirmationSent: confirmation.success });
  } catch (error) {
    console.error("Notify request error:", error);
    return NextResponse.json(
      { error: "Failed to submit request" },
      { status: 500 }
    );
  }
}
