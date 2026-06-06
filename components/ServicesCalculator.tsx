"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CONCIERGE_ADDON,
  SERVICE_PACKAGES,
  SERVICES,
  SERVICES_DISCLAIMER,
  formatServicePrice,
  serviceById,
} from "@/lib/servicesCatalog";
import {
  INSPECTION_TIER_IDS,
  SERVICES_REQUEST_SUMMARY_KEY,
  SERVICE_SITUATIONS,
  applyCatalogItemToState,
  buildServicesRequestSummary,
  buildServicesRequestUrl,
  calculateQuote,
  calculatorStateForSituation,
  emptyCalculatorState,
  getInspectionTier,
  getInspectionTierQty,
  getQuantity,
  isBundledInPackage,
  setConciergeAddon,
  setInspectionTier,
  setPackage,
  setQuantity,
  situationById,
  toggleService,
  type CalculatorState,
  type InspectionTierId,
  type SituationId,
} from "@/lib/servicesCalculator";

function Stepper({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-stone-200 bg-white">
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={() => onChange(value - 1)}
        className="px-2.5 py-1 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
        aria-label="Decrease"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-sm font-medium tabular-nums text-stone-800">{value}</span>
      <button
        type="button"
        disabled={disabled || value >= 5}
        onClick={() => onChange(value + 1)}
        className="px-2.5 py-1 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

function scrollToCalculator() {
  window.setTimeout(() => {
    document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}

export default function ServicesCalculator() {
  return (
    <Suspense fallback={<ServicesCalculatorShell />}>
      <ServicesCalculatorInner />
    </Suspense>
  );
}

function ServicesCalculatorShell() {
  return (
    <section
      id="calculator"
      className="scroll-mt-8 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/50 p-5 shadow-sm md:p-8"
    >
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Build your Bali setup</h2>
      <p className="mt-2 text-sm text-stone-500">Loading calculator…</p>
    </section>
  );
}

function ServicesCalculatorInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [situationId, setSituationId] = useState<SituationId | null>(null);
  const [state, setState] = useState<CalculatorState>(emptyCalculatorState);

  useEffect(() => {
    const add = searchParams.get("add");
    if (add) {
      setState((prev) => applyCatalogItemToState(prev, add) ?? prev);
      setSituationId(null);
      router.replace(`${pathname}#calculator`, { scroll: false });
      scrollToCalculator();
      return;
    }
    if (window.location.hash === "#calculator") {
      scrollToCalculator();
    }
  }, [searchParams, router, pathname]);

  const activeSituation = situationId ? situationById(situationId) : undefined;

  const applySituation = (id: SituationId) => {
    setSituationId(id);
    setState(calculatorStateForSituation(id));
  };

  const quote = useMemo(() => calculateQuote(state), [state]);
  const requestHref = useMemo(() => buildServicesRequestUrl(state), [state]);

  const persistSummaryAndNavigate = () => {
    try {
      sessionStorage.setItem(SERVICES_REQUEST_SUMMARY_KEY, buildServicesRequestSummary(state));
    } catch {
      /* ignore */
    }
  };

  const villaServices = SERVICES.filter(
    (s) => s.block === "villa" && !(INSPECTION_TIER_IDS as readonly string[]).includes(s.id)
  );
  const welcomeServices = SERVICES.filter((s) => s.block === "welcome");
  const settlingServices = SERVICES.filter((s) => s.block === "settling");
  const buyingServices = SERVICES.filter((s) => s.block === "buying");

  return (
    <section id="calculator" className="scroll-mt-8 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/50 p-5 shadow-sm md:p-8">
      <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Build your Bali setup</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
        Tick what you need — we add up an estimated Balitrusted service fee. Government, rent, and partner costs are
        quoted separately before you confirm.
      </p>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Your situation</p>
        <p className="mt-1 text-xs text-stone-500">Pick a starting point — we pre-fill typical services; you can still change every item.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSituationId(null);
              setState(emptyCalculatorState());
            }}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              situationId === null
                ? "border-emerald-500 bg-emerald-600 text-white"
                : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
            }`}
          >
            Start empty
          </button>
          {SERVICE_SITUATIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => applySituation(opt.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                situationId === opt.id
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-emerald-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {activeSituation ? (
          <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-900">
            {activeSituation.hint}
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-8">
          <CalculatorGroup
            title="Villa checks & rental"
            hint="Pick one check level per villa — remote, live video, or on-site. Not cumulative."
          >
            <InspectionTierPicker state={state} onChange={setState} />
            {villaServices.map((s) => (
              <CalculatorRow key={s.id} id={s.id} state={state} onChange={setState} />
            ))}
          </CalculatorGroup>

          <CalculatorGroup title="Welcome">
            {welcomeServices.map((s) => (
              <CalculatorRow key={s.id} id={s.id} state={state} onChange={setState} />
            ))}
          </CalculatorGroup>

          <CalculatorGroup title="Settling-in">
            {settlingServices.map((s) => (
              <CalculatorRow key={s.id} id={s.id} state={state} onChange={setState} />
            ))}
          </CalculatorGroup>

          <CalculatorGroup title="Relocation package">
            <div className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5">
                <input
                  type="radio"
                  name="package"
                  checked={state.packageId === null}
                  onChange={() => setState(setPackage(state, null))}
                  className="mt-1"
                />
                <span className="text-sm text-stone-700">No package — à la carte only</span>
              </label>
              {SERVICE_PACKAGES.map((pkg) => (
                <PackageCalculatorRow
                  key={pkg.id}
                  pkg={pkg}
                  selected={state.packageId === pkg.id}
                  onSelect={() => setState(setPackage(state, pkg.id))}
                />
              ))}
              <div className="rounded-xl border border-stone-200 bg-white px-3 py-2.5">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={state.conciergeAddon}
                    onChange={(e) => setState(setConciergeAddon(state, e.target.checked))}
                    className="mt-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-900">{CONCIERGE_ADDON.name}</span>
                    <ServiceDetailMeta
                      serviceId={CONCIERGE_ADDON.id}
                      tagline={CONCIERGE_ADDON.tagline}
                      includes={CONCIERGE_ADDON.includes}
                      priceLabel={`+${formatServicePrice(CONCIERGE_ADDON.priceUsd, CONCIERGE_ADDON.priceIdr)}`}
                    />
                  </span>
                </label>
              </div>
            </div>
          </CalculatorGroup>

          <CalculatorGroup title="Buying">
            {buyingServices.map((s) => (
              <CalculatorRow key={s.id} id={s.id} state={state} onChange={setState} />
            ))}
          </CalculatorGroup>
        </div>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Estimate</p>
          {quote.lines.length === 0 ? (
            <p className="mt-3 text-sm text-stone-500">Select services or a package to see a total.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm text-stone-700">
              {quote.lines.map((line) => (
                <li key={line.label} className="flex justify-between gap-2">
                  <span className="min-w-0">{line.label}</span>
                  <span className="shrink-0 tabular-nums font-medium">${line.amountUsd}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 border-t border-stone-100 pt-3">
            <div className="flex justify-between text-base font-semibold text-stone-900">
              <span>Service fee</span>
              <span className="tabular-nums">${quote.totalUsd.toLocaleString("en-US")}</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-stone-500">{SERVICES_DISCLAIMER}</p>
          <Link
            href={quote.totalUsd > 0 ? requestHref : "/request"}
            onClick={() => {
              if (quote.totalUsd > 0) persistSummaryAndNavigate();
            }}
            className={`mt-4 block w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition ${
              quote.totalUsd > 0
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-stone-200 text-stone-500 pointer-events-none"
            }`}
            aria-disabled={quote.totalUsd === 0}
          >
            Request this setup
          </Link>
        </aside>
      </div>
    </section>
  );
}

function CalculatorGroup({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-800">{title}</h3>
      {hint ? <p className="mt-0.5 text-xs text-stone-500">{hint}</p> : null}
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}

function ServiceIncludesToggle({
  serviceId,
  includes,
}: {
  serviceId: string;
  includes: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="text-xs font-medium text-emerald-800 hover:text-emerald-950"
        aria-expanded={open}
      >
        {open ? "Hide what's included" : "What's included"}
      </button>
      {open ? (
        <div className="mt-1.5">
          <ul className="space-y-1 text-xs leading-relaxed text-stone-600">
            {includes.map((line) => (
              <li key={line} className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>
                  ·
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <a
            href={`#service-${serviceId}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-block text-xs text-stone-500 underline-offset-2 hover:text-emerald-800 hover:underline"
          >
            Full details ↓
          </a>
        </div>
      ) : null}
    </div>
  );
}

function ServiceDetailMeta({
  serviceId,
  tagline,
  includes,
  priceLabel,
}: {
  serviceId: string;
  tagline: string;
  includes: string[];
  priceLabel: string;
}) {
  return (
    <>
      <p className="text-xs text-stone-500">{priceLabel}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-stone-600">{tagline}</p>
      <ServiceIncludesToggle serviceId={serviceId} includes={includes} />
    </>
  );
}

function PackageCalculatorRow({
  pkg,
  selected,
  onSelect,
}: {
  pkg: (typeof SERVICE_PACKAGES)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        selected ? "border-emerald-400 bg-emerald-50/80" : "border-stone-200 bg-white"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="radio"
          name="package"
          checked={selected}
          onChange={onSelect}
          className="mt-1"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-stone-900">
            {pkg.name}
            {pkg.popular ? (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                Popular
              </span>
            ) : null}
          </span>
          <ServiceDetailMeta
            serviceId={pkg.id}
            tagline={pkg.tagline}
            includes={pkg.includes}
            priceLabel={formatServicePrice(pkg.priceUsd, pkg.priceIdr)}
          />
        </span>
      </label>
    </div>
  );
}

function InspectionTierPicker({
  state,
  onChange,
}: {
  state: CalculatorState;
  onChange: (s: CalculatorState) => void;
}) {
  const tier = getInspectionTier(state);
  const qty = getInspectionTierQty(state);
  const bundled = tier ? isBundledInPackage(state, tier) : false;

  const selectTier = (next: InspectionTierId | null) => {
    if (!next) onChange(setInspectionTier(state, null, 0));
    else onChange(setInspectionTier(state, next, qty > 0 ? qty : 1));
  };

  return (
    <div className="rounded-xl border border-emerald-100 bg-white px-3 py-3">
      <p className="text-sm font-medium text-stone-900">Villa check level</p>
      <p className="mt-0.5 text-xs text-stone-500">
        Three tiers of the same reality check — remote, live video, or full on-site. Pick one, not all.
      </p>
      <fieldset className="mt-3 space-y-1.5">
        <legend className="sr-only">Villa check level</legend>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-transparent px-2 py-1.5 hover:bg-stone-50">
          <input
            type="radio"
            name="inspection-tier"
            checked={tier === null}
            onChange={() => selectTier(null)}
            className="mt-0.5"
          />
          <span className="min-w-0 flex-1 text-sm text-stone-700">No villa check</span>
        </label>
        {INSPECTION_TIER_IDS.map((id) => {
          const s = serviceById(id);
          if (!s) return null;
          return (
            <div
              key={id}
              className={`rounded-lg border px-2 py-1.5 transition ${
                tier === id ? "border-emerald-200 bg-emerald-50/60" : "border-transparent hover:bg-stone-50"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="radio"
                  name="inspection-tier"
                  checked={tier === id}
                  onChange={() => selectTier(id)}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-stone-900">{s.name}</span>
                  <ServiceDetailMeta
                    serviceId={s.id}
                    tagline={s.tagline}
                    includes={s.includes}
                    priceLabel={formatServicePrice(s.priceUsd, s.priceIdr)}
                  />
                </span>
              </label>
            </div>
          );
        })}
      </fieldset>
      {tier ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
          <div>
            <p className="text-sm text-stone-800">How many properties?</p>
            {bundled ? (
              <p className="text-[11px] text-emerald-700">Included in selected package (no extra line item)</p>
            ) : null}
          </div>
          <Stepper
            value={qty}
            onChange={(n) => onChange(setInspectionTier(state, tier, n))}
          />
        </div>
      ) : null}
    </div>
  );
}

function CalculatorRow({
  id,
  state,
  onChange,
  quantity = false,
  pricePrefix = "",
}: {
  id: string;
  state: CalculatorState;
  onChange: (s: CalculatorState) => void;
  quantity?: boolean;
  pricePrefix?: string;
}) {
  const service = serviceById(id);
  if (!service) return null;

  const bundled = isBundledInPackage(state, id);
  const qty = getQuantity(state, id);
  const priceLabel = `${pricePrefix}${formatServicePrice(service.priceUsd, service.priceIdr)}`;

  if (quantity) {
    return (
      <div
        className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border px-3 py-2.5 ${
          bundled ? "border-stone-100 bg-stone-50 opacity-60" : "border-stone-200 bg-white"
        }`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-stone-900">{service.name}</p>
          <ServiceDetailMeta
            serviceId={service.id}
            tagline={service.tagline}
            includes={service.includes}
            priceLabel={priceLabel}
          />
          {bundled ? <p className="mt-1 text-[11px] text-emerald-700">Included in selected package</p> : null}
        </div>
        <Stepper
          value={bundled ? 0 : qty}
          disabled={bundled}
          onChange={(n) => onChange(setQuantity(state, id, n))}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        bundled ? "border-stone-100 bg-stone-50 opacity-60" : "border-stone-200 bg-white"
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={!bundled && qty > 0}
          disabled={bundled}
          onChange={() => onChange(toggleService(state, id))}
          className="mt-1"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-stone-900">{service.name}</span>
          <ServiceDetailMeta
            serviceId={service.id}
            tagline={service.tagline}
            includes={service.includes}
            priceLabel={priceLabel}
          />
          {bundled ? <span className="mt-1 block text-[11px] text-emerald-700">Included in selected package</span> : null}
        </span>
      </label>
    </div>
  );
}
