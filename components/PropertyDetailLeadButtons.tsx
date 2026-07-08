"use client";

import { useState } from "react";
import { trackLead } from "@/lib/analytics";
import { getRequestAttributionForSubmit } from "@/lib/attributionClient";

type LeadKind = "book" | "info" | "buy";

type Props = {
  propertyId: string;
  propertyTitle: string;
  propertyPageUrl: string;
  hasRent: boolean;
  hasSale: boolean;
  hasLand: boolean;
  hasBusiness: boolean;
  archived: boolean;
};

function LeadModal({
  kind,
  title,
  onClose,
  propertyId,
  propertyTitle,
  propertyPageUrl,
}: {
  kind: LeadKind;
  title: string;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  propertyPageUrl: string;
}) {
  const [contactMethod, setContactMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [contactValue, setContactValue] = useState("");
  const [name, setName] = useState("");
  const [desiredStart, setDesiredStart] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const requestType =
    kind === "book" ? "property-book" : kind === "buy" ? "property-buy" : "property-info";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const email = contactMethod === "email" ? contactValue.trim() : "";
      const whatsapp = contactMethod === "whatsapp" ? contactValue.trim() : "";
      if (!name.trim()) throw new Error("Name is required");
      if (!email && !whatsapp) {
        throw new Error(contactMethod === "whatsapp" ? "Enter your WhatsApp number" : "Enter your email");
      }

      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          name: name.trim(),
          email: email || "",
          whatsapp: whatsapp || "",
          preferredContact: contactMethod === "whatsapp" ? "whatsapp" : "email",
          message: kind === "info" || kind === "buy" ? comment.trim() || undefined : undefined,
          desiredStart: kind === "book" && desiredStart.trim() ? desiredStart.trim() : undefined,
          propertyId,
          propertyTitle,
          propertyUrl: propertyPageUrl,
          attribution: getRequestAttributionForSubmit(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send");
      setSent(true);
      trackLead(requestType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <p className="font-semibold text-emerald-900">You are all set!</p>
            <p className="mt-2 text-sm text-emerald-800">
              Our specialist will contact you shortly with next steps.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs text-stone-500 line-clamp-2">{propertyTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              placeholder="Your name"
              autoComplete="name"
            />
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-stone-700">Contact *</span>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => setContactMethod("whatsapp")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  contactMethod === "whatsapp"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setContactMethod("email")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  contactMethod === "email"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Email
              </button>
            </div>
            {contactMethod === "whatsapp" ? (
              <input
                type="tel"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                placeholder="WhatsApp with country code"
                autoComplete="tel"
              />
            ) : (
              <input
                type="email"
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                placeholder="you@example.com"
                autoComplete="email"
              />
            )}
          </div>

          {kind === "book" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">Preferred start date</label>
              <input
                type="date"
                value={desiredStart}
                onChange={(e) => setDesiredStart(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          )}

          {(kind === "info" || kind === "buy") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                What matters for you? (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                placeholder="Budget, timing, questions…"
              />
            </div>
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-stone-300 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PropertyDetailLeadButtons({
  propertyId,
  propertyTitle,
  propertyPageUrl,
  hasRent,
  hasSale,
  hasLand,
  hasBusiness,
  archived,
}: Props) {
  const [open, setOpen] = useState<LeadKind | null>(null);

  if (archived) return null;

  const rentNeedsEnquire = hasRent && (hasLand || hasBusiness);

  const primaryBookLabel = rentNeedsEnquire ? "Enquire" : "Book";

  return (
    <>
      <div className="flex flex-col gap-3">
        {hasRent && (
          <button
            type="button"
            onClick={() => setOpen("book")}
            className="w-full rounded-xl bg-emerald-700 px-6 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            {primaryBookLabel}
          </button>
        )}
        {hasSale && (
          <button
            type="button"
            onClick={() => setOpen("buy")}
            className={`w-full rounded-xl px-6 py-3 text-center text-base font-semibold transition ${
              hasRent
                ? "border-2 border-emerald-700 bg-white text-emerald-900 hover:bg-emerald-50"
                : "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
            }`}
          >
            {hasLand ? "Buy (land)" : hasBusiness ? "Buy (business)" : "Buy"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen("info")}
          className="w-full rounded-xl border-2 border-stone-300 bg-white px-6 py-3 text-center text-base font-semibold text-stone-900 hover:bg-stone-50"
        >
          Request information
        </button>
      </div>

      {open === "book" && (
        <LeadModal
          kind="book"
          title={rentNeedsEnquire ? "Enquire about this listing" : "Book this villa"}
          onClose={() => setOpen(null)}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          propertyPageUrl={propertyPageUrl}
        />
      )}
      {open === "info" && (
        <LeadModal
          kind="info"
          title="Request information"
          onClose={() => setOpen(null)}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          propertyPageUrl={propertyPageUrl}
        />
      )}
      {open === "buy" && (
        <LeadModal
          kind="buy"
          title="Buy — tell us how to reach you"
          onClose={() => setOpen(null)}
          propertyId={propertyId}
          propertyTitle={propertyTitle}
          propertyPageUrl={propertyPageUrl}
        />
      )}
    </>
  );
}
