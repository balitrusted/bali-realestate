import {
  CONCIERGE_ADDON,
  SERVICE_PACKAGES,
  SERVICES,
  serviceById,
  packageById,
} from "@/lib/servicesCatalog";

export type CalculatorQuantities = Record<string, number>;

export type CalculatorState = {
  quantities: CalculatorQuantities;
  packageId: string | null;
  conciergeAddon: boolean;
};

export function emptyCalculatorState(): CalculatorState {
  return { quantities: {}, packageId: null, conciergeAddon: false };
}

export type SituationId = "abroad" | "arrived" | "ubud" | "buying";

export const SERVICE_SITUATIONS: {
  id: SituationId;
  label: string;
  hint: string;
  preset: CalculatorState;
}[] = [
  {
    id: "abroad",
    label: "Not on Bali yet",
    hint: "Suggested: Remote Villa Reality Check + Villa Shortlist Hunt — adjust anything below.",
    preset: {
      quantities: { a1: 1, a4: 1 },
      packageId: null,
      conciergeAddon: false,
    },
  },
  {
    id: "arrived",
    label: "Just landed",
    hint: "Suggested: Airport transfer, scooter setup, and a viewing day — adjust anything below.",
    preset: {
      quantities: { b1: 1, b2: 1, a7: 1 },
      packageId: null,
      conciergeAddon: false,
    },
  },
  {
    id: "ubud",
    label: "Already in Ubud",
    hint: "Suggested: On-site inspection, rent negotiation, and lease review — adjust anything below.",
    preset: {
      quantities: { a3: 1, a5: 1, a6: 1 },
      packageId: null,
      conciergeAddon: false,
    },
  },
  {
    id: "buying",
    label: "Buying property",
    hint: "Suggested: Legal due diligence + structural inspection — adjust anything below.",
    preset: {
      quantities: { e1: 1, e2: 1 },
      packageId: null,
      conciergeAddon: false,
    },
  },
];

export function calculatorStateForSituation(id: SituationId): CalculatorState {
  const row = SERVICE_SITUATIONS.find((s) => s.id === id);
  if (!row) return emptyCalculatorState();
  return {
    packageId: row.preset.packageId,
    conciergeAddon: row.preset.conciergeAddon,
    quantities: { ...row.preset.quantities },
  };
}

export function situationById(id: SituationId) {
  return SERVICE_SITUATIONS.find((s) => s.id === id);
}

/** One level per villa: remote → live video → on-site (mutually exclusive). */
export const INSPECTION_TIER_IDS = ["a1", "a2", "a3"] as const;
export type InspectionTierId = (typeof INSPECTION_TIER_IDS)[number];

/** @deprecated Use INSPECTION_TIER_IDS — kept for quote iteration. */
export const QUANTITY_SERVICE_IDS = INSPECTION_TIER_IDS;

function isInspectionTier(id: string): id is InspectionTierId {
  return (INSPECTION_TIER_IDS as readonly string[]).includes(id);
}

export function getInspectionTier(state: CalculatorState): InspectionTierId | null {
  for (const id of INSPECTION_TIER_IDS) {
    if (getQuantity(state, id) > 0) return id;
  }
  return null;
}

export function getInspectionTierQty(state: CalculatorState): number {
  const tier = getInspectionTier(state);
  return tier ? getQuantity(state, tier) : 0;
}

/** Set villa check level and how many properties (replaces any other tier). */
export function setInspectionTier(
  state: CalculatorState,
  tier: InspectionTierId | null,
  qty: number
): CalculatorState {
  let next: CalculatorState = {
    ...state,
    quantities: { ...state.quantities },
  };
  for (const id of INSPECTION_TIER_IDS) {
    delete next.quantities[id];
  }
  if (tier && qty > 0) {
    next = setQuantityRaw(next, tier, Math.min(5, Math.max(1, qty)));
  }
  return next;
}

function setQuantityRaw(state: CalculatorState, id: string, qty: number): CalculatorState {
  const next = { ...state, quantities: { ...state.quantities } };
  if (qty <= 0) delete next.quantities[id];
  else next.quantities[id] = qty;
  return next;
}

export function getQuantity(state: CalculatorState, id: string): number {
  return state.quantities[id] ?? 0;
}

export function setQuantity(state: CalculatorState, id: string, qty: number): CalculatorState {
  if (isInspectionTier(id)) {
    if (qty <= 0) return setInspectionTier(state, null, 0);
    return setInspectionTier(state, id, qty);
  }
  const next = { ...state, quantities: { ...state.quantities } };
  if (qty <= 0) delete next.quantities[id];
  else next.quantities[id] = Math.min(5, Math.max(0, qty));
  return next;
}

export function toggleService(state: CalculatorState, id: string): CalculatorState {
  if (isInspectionTier(id)) {
    const active = getInspectionTier(state);
    if (active === id) return setInspectionTier(state, null, 0);
    return setInspectionTier(state, id, getInspectionTierQty(state) || 1);
  }
  const qty = getQuantity(state, id);
  if (qty > 0) return setQuantity(state, id, 0);
  return setQuantity(state, id, 1);
}

export function isServiceChecked(state: CalculatorState, id: string): boolean {
  return getQuantity(state, id) > 0;
}

export function setPackage(state: CalculatorState, packageId: string | null): CalculatorState {
  return { ...state, packageId };
}

export function setConciergeAddon(state: CalculatorState, on: boolean): CalculatorState {
  return { ...state, conciergeAddon: on };
}

/** Add a catalog item (service, package, or concierge) from service cards / ?add= links. */
export function applyCatalogItemToState(state: CalculatorState, id: string): CalculatorState | null {
  if (packageById(id)) {
    return setPackage(state, id);
  }
  if (id === CONCIERGE_ADDON.id) {
    if (state.conciergeAddon) return state;
    return setConciergeAddon(state, true);
  }
  if (isInspectionTier(id)) {
    const active = getInspectionTier(state);
    const qty = getInspectionTierQty(state);
    if (active === id && qty > 0) return state;
    return setInspectionTier(state, id, qty > 0 ? qty : 1);
  }
  if (serviceById(id)) {
    if (getQuantity(state, id) > 0) return state;
    return setQuantity(state, id, 1);
  }
  return null;
}

function bundledIds(state: CalculatorState): Set<string> {
  const set = new Set<string>();
  if (!state.packageId) return set;
  const pkg = packageById(state.packageId);
  if (!pkg) return set;
  pkg.bundledServiceIds.forEach((id) => set.add(id));
  return set;
}

export function isBundledInPackage(state: CalculatorState, serviceId: string): boolean {
  return bundledIds(state).has(serviceId);
}

export type LineItem = { label: string; amountUsd: number };

export function calculateQuote(state: CalculatorState): { totalUsd: number; lines: LineItem[] } {
  const lines: LineItem[] = [];
  const bundled = bundledIds(state);

  if (state.packageId) {
    const pkg = packageById(state.packageId);
    if (pkg) {
      lines.push({ label: pkg.name, amountUsd: pkg.priceUsd });
    }
  }

  for (const id of QUANTITY_SERVICE_IDS) {
    if (bundled.has(id)) continue;
    const qty = getQuantity(state, id);
    if (qty <= 0) continue;
    const s = serviceById(id);
    if (!s) continue;
    lines.push({
      label: qty === 1 ? s.name : `${s.name} × ${qty}`,
      amountUsd: s.priceUsd * qty,
    });
  }

  for (const s of SERVICES) {
    if ((QUANTITY_SERVICE_IDS as readonly string[]).includes(s.id)) continue;
    if (bundled.has(s.id)) continue;
    const qty = getQuantity(state, s.id);
    if (qty <= 0) continue;
    lines.push({ label: s.name, amountUsd: s.priceUsd * qty });
  }

  if (state.conciergeAddon) {
    lines.push({ label: CONCIERGE_ADDON.name, amountUsd: CONCIERGE_ADDON.priceUsd });
  }

  const totalUsd = lines.reduce((sum, l) => sum + l.amountUsd, 0);
  return { totalUsd, lines };
}

export const SERVICES_REQUEST_SUMMARY_KEY = "balitrusted-services-request-summary";

export function buildServicesRequestSummary(state: CalculatorState): string {
  const { totalUsd, lines } = calculateQuote(state);
  return [
    "Services inquiry from balitrusted.com/services",
    "",
    ...lines.map((l) => `• ${l.label}: $${l.amountUsd}`),
    "",
    `Estimated Balitrusted service fee: $${totalUsd}`,
    "(Visa, rent, and third-party costs quoted separately.)",
  ].join("\n");
}

export function buildServicesRequestUrl(state: CalculatorState): string {
  const { totalUsd } = calculateQuote(state);
  const params = new URLSearchParams();
  params.set("from", "services");

  const serviceIds: string[] = [];
  if (state.packageId) serviceIds.push(state.packageId);
  if (state.conciergeAddon) serviceIds.push("d4");

  for (const s of SERVICES) {
    const qty = getQuantity(state, s.id);
    if (qty > 0 && !isBundledInPackage(state, s.id)) {
      for (let i = 0; i < qty; i++) serviceIds.push(s.id);
    }
  }

  if (serviceIds.length > 0) params.set("services", serviceIds.join(","));
  params.set("estimate", String(totalUsd));

  return `/request?${params.toString()}`;
}

export function parseCalculatorFromParams(searchParams: URLSearchParams): CalculatorState | null {
  const from = searchParams.get("from");
  if (from !== "services") return null;
  const ids = (searchParams.get("services") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids.length === 0) return null;

  let state = emptyCalculatorState();
  for (const id of ids) {
    if (id === "d4") {
      state = setConciergeAddon(state, true);
      continue;
    }
    const pkg = SERVICE_PACKAGES.find((p) => p.id === id);
    if (pkg) {
      state = setPackage(state, id);
      continue;
    }
    const prev = getQuantity(state, id);
    state = setQuantity(state, id, prev + 1);
  }
  return state;
}
