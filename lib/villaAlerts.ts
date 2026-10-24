import { sendEmail } from "@/lib/email";
import { getNotifyRequests } from "@/lib/notifyRequestsData";
import { diffPropertyFields } from "@/lib/propertyChangeDiff";
import { buildPropertySlugIndex } from "@/lib/propertySlug";
import { getPropertyDisplayTitle } from "@/lib/propertyUtils";
import type { Property } from "@/types/property";

export type VillaAlertChanges = {
  backAvailable: boolean;
  priceLines: string[];
  detailLines: string[];
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[c];
  });
}

function money(amount: unknown, currency: string): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "not set";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
}

const PRICE_LABELS: Array<["monthly" | "yearly" | "forSale" | "min", string]> = [
  ["monthly", "Monthly rent"],
  ["yearly", "Yearly rent"],
  ["forSale", "Sale price"],
  ["min", "Price"],
];

/** Describes the changes subscribers care about; empty result means no email. */
export function describeAlertChanges(before: Property, after: Property): VillaAlertChanges {
  const result: VillaAlertChanges = { backAvailable: false, priceLines: [], detailLines: [] };
  if (after.archived === true) return result;

  result.backAvailable = before.archived === true;

  const changes = diffPropertyFields(before, after);
  const currency = after.price?.currency || "IDR";
  for (const [key, label] of PRICE_LABELS) {
    if (changes[`price.${key}`]) {
      result.priceLines.push(
        `${label}: ${money(before.price?.[key], before.price?.currency || currency)} → ${money(after.price?.[key], currency)}`
      );
    }
  }
  if (result.priceLines.length === 0 && changes["price.currency"]) {
    result.priceLines.push(`Price currency: ${before.price?.currency} → ${currency}`);
  }

  if (changes.description) result.detailLines.push("The description was updated");
  if (changes.features) result.detailLines.push("Amenities were updated");
  const beforeImages = before.images?.length ?? 0;
  const afterImages = after.images?.length ?? 0;
  if (beforeImages !== afterImages) {
    result.detailLines.push(
      afterImages > beforeImages ? "New photos were added" : "Some photos were removed"
    );
  }
  for (const [field, label] of [["bedrooms", "Bedrooms"], ["bathrooms", "Bathrooms"], ["floors", "Floors"]] as const) {
    if (changes[field]) {
      result.detailLines.push(`${label}: ${String(before[field] ?? "—")} → ${String(after[field] ?? "—")}`);
    }
  }
  return result;
}

export function hasAlertChanges(c: VillaAlertChanges): boolean {
  return c.backAvailable || c.priceLines.length > 0 || c.detailLines.length > 0;
}

/** Emails everyone subscribed to this villa. Never throws: a mail failure must not break saving. */
export async function notifyVillaSubscribers(params: {
  before: Property;
  after: Property;
  allProperties: Property[];
  siteBaseUrl: string;
}): Promise<void> {
  try {
    const { before, after, allProperties, siteBaseUrl } = params;
    const changes = describeAlertChanges(before, after);
    if (!hasAlertChanges(changes)) return;

    const subscribers = (await getNotifyRequests()).filter((r) => r.propertyId === String(after.id));
    if (subscribers.length === 0) return;

    const title = getPropertyDisplayTitle(after);
    const propertyUrl = `${siteBaseUrl}${buildPropertySlugIndex(allProperties).pathFor(after)}`;

    const sections: Array<{ heading: string; lines: string[] }> = [];
    if (changes.backAvailable) sections.push({ heading: "Back in stock", lines: ["This villa is available again."] });
    if (changes.priceLines.length) sections.push({ heading: "Price changed", lines: changes.priceLines });
    if (changes.detailLines.length) sections.push({ heading: "Listing updated", lines: changes.detailLines });

    const subject = changes.backAvailable
      ? `Available again: ${title}`
      : changes.priceLines.length
        ? `Price update: ${title}`
        : `Listing update: ${title}`;
    const cleanSubject = subject.replace(/[\r\n]/g, " ");

    for (const sub of subscribers) {
      const unsubscribeUrl = `${siteBaseUrl}/unsubscribe/notify?token=${encodeURIComponent(sub.id)}`;
      const text =
        `Hi ${sub.name},\n\nThere is an update on ${title}:\n\n` +
        sections.map((s) => `${s.heading}\n${s.lines.map((l) => `- ${l}`).join("\n")}`).join("\n\n") +
        `\n\nView the villa: ${propertyUrl}\n\nTo stop these updates, visit: ${unsubscribeUrl}`;
      const html = `
        <h1>Update on ${escapeHtml(title)}</h1>
        <p>Hi ${escapeHtml(sub.name)},</p>
        ${sections
          .map(
            (s) =>
              `<h3>${escapeHtml(s.heading)}</h3><ul>${s.lines.map((l) => `<li>${escapeHtml(l)}</li>`).join("")}</ul>`
          )
          .join("")}
        <p><a href="${escapeHtml(propertyUrl)}">View the villa</a></p>
        <hr />
        <p style="font-size:12px;color:#6b7280">You receive this because you subscribed to updates for this villa.</p>
        <p><a href="${escapeHtml(unsubscribeUrl)}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#f3f4f6;color:#374151;text-decoration:none;font-weight:600">Unsubscribe</a></p>
        <p>${escapeHtml(siteBaseUrl)} · Balitrusted</p>
      `;
      const sent = await sendEmail({ to: sub.email, subject: cleanSubject, text, html });
      if (!sent.success) console.error("Villa alert email failed:", sent.error);
    }
  } catch (error) {
    console.error("notifyVillaSubscribers failed:", error);
  }
}
