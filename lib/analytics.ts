"use client";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** Fire GA4 lead event; never throw — ad blockers must not break form success UI. */
export function trackLead(formType: string): void {
  try {
    if (typeof window === "undefined") return;
    if (typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", {
        form_type: formType,
      });
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "generate_lead",
      form_type: formType,
    });
  } catch {
    /* ignore GA failures */
  }
}
