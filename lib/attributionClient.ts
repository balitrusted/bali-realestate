"use client";

import type { RequestAttribution } from "@/lib/attribution";

const STORAGE_KEY = "balitrusted-request-attribution-v1";

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^www\./, "").toLowerCase();
}

function isSameSiteReferrer(referrer: string): boolean {
  if (!referrer || typeof window === "undefined") return false;
  try {
    const refHost = normalizeHostname(new URL(referrer).hostname);
    const siteHost = normalizeHostname(window.location.hostname);
    return refHost === siteHost;
  } catch {
    return false;
  }
}

function effectiveReferrer(referrer: string): string {
  return isSameSiteReferrer(referrer) ? "" : referrer;
}

function normalizeSource(source: string | null, referrer: string): string {
  if (source) return source;
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("google.")) return "google";
    return host;
  } catch {
    return "referral";
  }
}

function normalizeMedium(medium: string | null, referrer: string): string {
  if (medium) return medium;
  if (!referrer) return "(none)";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host.includes("google.") || host.includes("bing.") || host.includes("yahoo.")) {
      return "organic";
    }
    return "referral";
  } catch {
    return "referral";
  }
}

export function captureFirstTouchAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    const url = new URL(window.location.href);
    const referrer = effectiveReferrer(document.referrer || "");
    const attribution: RequestAttribution = {
      source: normalizeSource(url.searchParams.get("utm_source"), referrer),
      medium: normalizeMedium(url.searchParams.get("utm_medium"), referrer),
      campaign: url.searchParams.get("utm_campaign") || undefined,
      term: url.searchParams.get("utm_term") || undefined,
      content: url.searchParams.get("utm_content") || undefined,
      referrer: referrer || undefined,
      landingPage: `${url.pathname}${url.search}${url.hash}`,
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    /* ignore storage failures */
  }
}

export function getRequestAttributionForSubmit(): RequestAttribution | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const base = raw ? (JSON.parse(raw) as RequestAttribution) : undefined;
    const conversionPage = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!base) return { conversionPage };
    return { ...base, conversionPage };
  } catch {
    return {
      conversionPage: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    };
  }
}
