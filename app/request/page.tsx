"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PriceInput } from "@/components/admin/PriceInput";
import { RequestFormCurrencySelect } from "@/components/RequestFormCurrencySelect";
import { getMergedAreaInfos } from "@/lib/mainAreaRegistry";
import { DEFAULT_CURRENCY, type SupportedCurrency } from "@/lib/currency";

type RequestType = "client-rent" | "client-other" | "owner" | "specialist";
type Role = "client" | "owner" | "specialist";
type Phase = "pick-role" | "pick-client-intent" | "form";

function formatWhatsApp(value: string) {
  let cleaned = value.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned.replace(/\+/g, "");
  }
  if (cleaned.length > 16) cleaned = cleaned.substring(0, 16);
  return cleaned;
}

function ownerStepIds(propertyType: string): string[] {
  const head = ["name", "contact", "propertyType"] as const;
  const tail = ["area", "price", "message"] as const;
  if (propertyType === "rent" || propertyType === "buy") {
    return [...head, "bedrooms", ...tail];
  }
  return [...head, ...tail];
}

function stepsForType(t: RequestType): string[] {
  switch (t) {
    case "client-rent":
      return ["name", "contact", "prefs", "budget", "message"];
    case "client-other":
    case "specialist":
      return ["name", "contact", "message"];
    default:
      return [];
  }
}

function RoleCardIcon({ kind }: { kind: "client" | "owner" | "specialist" | "find" | "other" }) {
  const cls = "h-6 w-6";
  switch (kind) {
    case "client":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      );
    case "owner":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-7h6v7"
          />
        </svg>
      );
    case "specialist":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
          />
        </svg>
      );
    case "find":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z" />
        </svg>
      );
    case "other":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3 12c0-4.243 4.03-8 9-8s9 3.757 9 8-4.03 8-9 8c-.685 0-1.35-.07-1.985-.2L3 21l1.165-3.495C3.41 16.26 3 14.173 3 12Z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function RequestForm() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("property");
  const idsParam = searchParams.get("ids");

  const [phase, setPhase] = useState<Phase>("pick-role");
  const [role, setRole] = useState<Role | null>(null);
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [stepId, setStepId] = useState<string>("name");
  const [prefillApplied, setPrefillApplied] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    preferredContact: "email" as "email" | "whatsapp",
    propertyType: "",
    area: "",
    bedrooms: "",
    budgetAmount: undefined as number | undefined,
    budgetPeriod: "month" as "month" | "year",
    budgetCurrency: DEFAULT_CURRENCY as SupportedCurrency,
    duration: [] as string[],
    message: "",
  });

  const steps = useMemo(() => {
    if (!requestType) return [];
    if (requestType === "owner") return ownerStepIds(formData.propertyType);
    return stepsForType(requestType);
  }, [requestType, formData.propertyType]);

  const stepIndex = steps.indexOf(stepId);
  const stepNumber = stepIndex >= 0 ? stepIndex + 1 : 1;
  const stepTotal = Math.max(steps.length, 1);

  const requestAreaOptions = useMemo(() => {
    const merged = getMergedAreaInfos().filter((a) => a.id !== "canggu");
    merged.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    return [
      ...merged.map((a) => ({ value: a.id, label: a.nameEn })),
      { value: "other", label: "Others" },
    ];
  }, []);

  useEffect(() => {
    if (prefillApplied) return;
    if (idsParam) {
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      setRequestType("client-rent");
      setRole("client");
      setPhase("form");
      setStepId("name");
      setFormData((prev) => ({
        ...prev,
        message:
          ids.length > 0
            ? `I'm interested in the following propert${ids.length === 1 ? "y" : "ies"} (from my saved list): ${ids.join(", ")}. Please provide more information or arrange a viewing.`
            : prev.message,
      }));
      setPrefillApplied(true);
      return;
    }
    if (propertyId) {
      setRequestType("client-rent");
      setRole("client");
      setPhase("form");
      setStepId("name");
      setFormData((prev) => ({
        ...prev,
        message: `I'm interested in property ${propertyId}. Please provide more information.`,
      }));
      setPrefillApplied(true);
    }
  }, [idsParam, propertyId, prefillApplied]);

  useEffect(() => {
    if (phase !== "form" || !requestType || steps.length === 0) return;
    if (!steps.includes(stepId)) {
      if (stepId === "bedrooms" && steps.includes("area")) setStepId("area");
      else setStepId(steps[0]!);
    }
  }, [phase, requestType, steps, stepId]);

  const goBack = () => {
    if (phase === "form" && steps.length > 0) {
      const i = steps.indexOf(stepId);
      if (i > 0) {
        setStepId(steps[i - 1]!);
        return;
      }
      setPhase(role === "client" ? "pick-client-intent" : "pick-role");
      setRequestType(null);
      setStepId("name");
      return;
    }
    if (phase === "pick-client-intent") {
      setPhase("pick-role");
      setRole(null);
    }
  };

  const goNext = () => {
    const i = steps.indexOf(stepId);
    if (i >= 0 && i < steps.length - 1) {
      setStepId(steps[i + 1]!);
    }
  };

  const validateCurrentStep = (): string | null => {
    if (!requestType || phase !== "form") return null;
    switch (stepId) {
      case "name":
        return formData.name.trim() ? null : "Please enter your name.";
      case "contact": {
        const em = formData.email.trim();
        const wa = formData.whatsapp.trim();
        if (!em && !wa) return "Enter your email or WhatsApp (at least one).";
        if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return "Please enter a valid email.";
        return null;
      }
      case "propertyType":
        return formData.propertyType ? null : "Choose a property type.";
      case "bedrooms":
        return formData.bedrooms ? null : "Select the number of bedrooms.";
      case "area":
        return formData.area ? null : "Select an area.";
      case "price":
        return null;
      case "prefs":
        return null;
      case "budget":
        return null;
      case "message": {
        if (requestType === "client-rent") return null;
        return formData.message.trim() ? null : "Please fill in this field.";
      }
      default:
        return null;
    }
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) });
  };

  const toggleDuration = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      duration: prev.duration.includes(value)
        ? prev.duration.filter((d) => d !== value)
        : [...prev.duration, value],
    }));
  };

  const handleSubmit = async () => {
    const err = validateCurrentStep();
    if (err) {
      setSubmitError(err);
      return;
    }
    setSubmitError(null);
    setSubmitSuccess(false);
    setSubmitting(true);
    const preferred =
      formData.email.trim() && formData.whatsapp.trim()
        ? formData.preferredContact
        : formData.whatsapp.trim()
          ? "whatsapp"
          : "email";
    const { budgetAmount, ...formPayload } = formData;
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType,
          ...formPayload,
          budget: budgetAmount != null ? String(budgetAmount) : "",
          preferredContact: preferred,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || "Failed to send. Please try again.");
        return;
      }
      setSubmitSuccess(true);
      setPhase("pick-role");
      setRole(null);
      setRequestType(null);
      setStepId("name");
      setFormData({
        name: "",
        email: "",
        whatsapp: "",
        preferredContact: "email",
        propertyType: "",
        area: "",
        bedrooms: "",
        budgetAmount: undefined,
        budgetPeriod: "month",
        budgetCurrency: DEFAULT_CURRENCY,
        duration: [],
        message: "",
      });
      setPrefillApplied(false);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const roleCards = [
    {
      id: "client" as const,
      kind: "client" as const,
      title: "I'm a client",
      subtitle: "Find a property or ask a question",
    },
    {
      id: "owner" as const,
      kind: "owner" as const,
      title: "I'm an owner",
      subtitle: "List as owner or agent — rent, sale, land, or business",
    },
    {
      id: "specialist" as const,
      kind: "specialist" as const,
      title: "I'm a specialist",
      subtitle: "Legal, tax, visa, or related services",
    },
  ];

  const clientIntentCards = [
    {
      id: "client-rent" as RequestType,
      kind: "find" as const,
      title: "Help me find a property",
      subtitle: "Rent, buy, land, or business search",
    },
    {
      id: "client-other" as RequestType,
      kind: "other" as const,
      title: "Something else",
      subtitle: "General questions for our team",
    },
  ];

  const isLastStep = phase === "form" && steps.length > 0 && stepId === steps[steps.length - 1];

  const onPrimary = () => {
    setSubmitError(null);
    const err = validateCurrentStep();
    if (err) {
      setSubmitError(err);
      return;
    }
    if (isLastStep) {
      void handleSubmit();
      return;
    }
    goNext();
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-lg">
          {submitSuccess ? (
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Request sent</h2>
              <p className="mb-6 text-gray-700">We have received your request and will contact you shortly.</p>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="rounded-md bg-gray-900 px-5 py-2.5 text-white transition-colors hover:bg-gray-800"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-3xl font-bold text-gray-900">Send a request</h1>
              <p className="mb-8 text-gray-600">
                {phase === "pick-role" && "Who are you? Pick one to continue."}
                {phase === "pick-client-intent" && "What can we help you with?"}
                {phase === "form" && requestType && (
                  <>
                    Step {stepNumber} of {stepTotal}
                  </>
                )}
              </p>

              {phase === "form" && requestType && (
                <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{ width: `${(stepNumber / stepTotal) * 100}%` }}
                  />
                </div>
              )}

              {phase === "pick-role" && (
                <div className="flex flex-col gap-3">
                  {roleCards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setRole(c.id);
                        if (c.id === "client") {
                          setPhase("pick-client-intent");
                        } else if (c.id === "owner") {
                          setRequestType("owner");
                          setPhase("form");
                          setStepId("name");
                        } else {
                          setRequestType("specialist");
                          setPhase("form");
                          setStepId("name");
                        }
                      }}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm ring-0 transition hover:border-emerald-200/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100/80 transition group-hover:bg-emerald-100">
                        <RoleCardIcon kind={c.kind} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold tracking-tight text-gray-900">{c.title}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-gray-500">{c.subtitle}</span>
                      </span>
                      <svg
                        className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {phase === "pick-client-intent" && (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="mb-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  {clientIntentCards.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setRequestType(c.id);
                        setPhase("form");
                        setStepId("name");
                      }}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200/90 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100/80 transition group-hover:bg-emerald-100">
                        <RoleCardIcon kind={c.kind} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold tracking-tight text-gray-900">{c.title}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-gray-500">{c.subtitle}</span>
                      </span>
                      <svg
                        className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}

              {phase === "form" && requestType && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onPrimary();
                  }}
                  className="space-y-6"
                >
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>

                  {stepId === "name" && (
                    <div>
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">Your name</h2>
                      <p className="mb-4 text-sm text-gray-500">We will use it when we reply to you.</p>
                      <input
                        type="text"
                        autoComplete="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        placeholder="e.g. Maria"
                      />
                    </div>
                  )}

                  {stepId === "contact" && (
                    <div>
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">How do we reach you?</h2>
                      <p className="mb-4 text-sm text-gray-500">Add email and/or WhatsApp — at least one is required.</p>
                      <div className="space-y-4">
                        <input
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          autoComplete="tel"
                          value={formData.whatsapp}
                          onChange={handleWhatsAppChange}
                          placeholder="WhatsApp (+country code)"
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                        {formData.email.trim() && formData.whatsapp.trim() && (
                          <fieldset className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                            <legend className="px-1 text-xs font-medium text-gray-600">Preferred</legend>
                            <div className="mt-1 flex gap-4">
                              <label className="flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                  type="radio"
                                  name="preferredContact"
                                  checked={formData.preferredContact === "email"}
                                  onChange={() => setFormData({ ...formData, preferredContact: "email" })}
                                />
                                Email
                              </label>
                              <label className="flex cursor-pointer items-center gap-2 text-sm">
                                <input
                                  type="radio"
                                  name="preferredContact"
                                  checked={formData.preferredContact === "whatsapp"}
                                  onChange={() => setFormData({ ...formData, preferredContact: "whatsapp" })}
                                />
                                WhatsApp
                              </label>
                            </div>
                          </fieldset>
                        )}
                      </div>
                    </div>
                  )}

                  {stepId === "prefs" && requestType === "client-rent" && (
                    <div>
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">What are you looking for?</h2>
                      <p className="mb-4 text-sm text-gray-500">A rough idea is enough; we can fine-tune later.</p>
                      <div className="space-y-5">
                        <div>
                          <label htmlFor="req-property-type" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Property type
                          </label>
                          <select
                            id="req-property-type"
                            value={formData.propertyType}
                            onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                          >
                            <option value="">Choose…</option>
                            <option value="rent">Rent a villa</option>
                            <option value="buy">Buy a villa</option>
                            <option value="land">Land</option>
                            <option value="business">Business</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="req-preferred-area" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Preferred area
                          </label>
                          <select
                            id="req-preferred-area"
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                          >
                            <option value="">Choose…</option>
                            {requestAreaOptions.map((a) => (
                              <option key={a.value} value={a.value}>
                                {a.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1.5 text-xs text-gray-400">
                            Main areas from our catalog. Pick <span className="font-medium text-gray-500">Others</span> if
                            yours is not listed (for example Canggu).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {stepId === "budget" && requestType === "client-rent" && (
                    <div>
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">Budget and timing</h2>
                      <p className="mb-4 text-sm text-gray-500">Optional — leave blank if unsure.</p>
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                          <div className="min-w-0 flex-1">
                            <label htmlFor="req-budget-amount" className="mb-1.5 block text-sm font-medium text-gray-700">
                              Amount
                            </label>
                            <PriceInput
                              id="req-budget-amount"
                              value={formData.budgetAmount}
                              onValueChange={(v) => setFormData({ ...formData, budgetAmount: v })}
                              currency={formData.budgetCurrency}
                              placeholder="Amount"
                              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                            />
                          </div>
                          {formData.propertyType === "rent" && (
                            <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm">
                              <label className="flex items-center gap-1.5">
                                <input
                                  type="radio"
                                  name="budgetPeriod"
                                  checked={formData.budgetPeriod === "month"}
                                  onChange={() => setFormData({ ...formData, budgetPeriod: "month" })}
                                />
                                / month
                              </label>
                              <label className="flex items-center gap-1.5">
                                <input
                                  type="radio"
                                  name="budgetPeriod"
                                  checked={formData.budgetPeriod === "year"}
                                  onChange={() => setFormData({ ...formData, budgetPeriod: "year" })}
                                />
                                / year
                              </label>
                            </div>
                          )}
                          <div className="w-full sm:w-auto sm:min-w-[7.5rem]">
                            <span className="mb-1.5 block text-sm font-medium text-gray-700">Currency</span>
                            <RequestFormCurrencySelect
                              value={formData.budgetCurrency}
                              onChange={(c) => setFormData({ ...formData, budgetCurrency: c })}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.duration.includes("monthly")}
                              onChange={() => toggleDuration("monthly")}
                            />
                            Monthly stay
                          </label>
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.duration.includes("yearly")}
                              onChange={() => toggleDuration("yearly")}
                            />
                            Yearly contract
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {stepId === "propertyType" && requestType === "owner" && (
                    <div>
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">What would you like to list?</h2>
                      <p className="mb-4 text-sm text-gray-500">Choose the closest match.</p>
                      <select
                        value={formData.propertyType}
                        onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      >
                        <option value="">Select…</option>
                        <option value="rent">Rent a villa</option>
                        <option value="buy">Buy a villa</option>
                        <option value="land">Land</option>
                        <option value="business">Business</option>
                      </select>
                    </div>
                  )}

                  {stepId === "bedrooms" && requestType === "owner" && (
                    <div>
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">Bedrooms</h2>
                      <p className="mb-4 text-sm text-gray-500">For villas and houses.</p>
                      <select
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      >
                        <option value="">Select…</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5+">5+</option>
                      </select>
                    </div>
                  )}

                  {stepId === "area" && requestType === "owner" && (
                    <div>
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">Where is it?</h2>
                      <p className="mb-4 text-sm text-gray-500">Main area in Bali.</p>
                      <select
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      >
                        <option value="">Select…</option>
                        {requestAreaOptions.map((a) => (
                          <option key={a.value} value={a.value}>
                            {a.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {stepId === "price" && requestType === "owner" && (
                    <div>
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">Price</h2>
                      <p className="mb-4 text-sm text-gray-500">Asking price or expected rent — optional for now.</p>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="min-w-0 flex-1">
                          <label htmlFor="req-owner-price" className="mb-1.5 block text-sm font-medium text-gray-700">
                            Amount
                          </label>
                          <PriceInput
                            id="req-owner-price"
                            value={formData.budgetAmount}
                            onValueChange={(v) => setFormData({ ...formData, budgetAmount: v })}
                            currency={formData.budgetCurrency}
                            placeholder="Amount"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                          />
                        </div>
                        <div className="w-full sm:w-auto sm:min-w-[7.5rem]">
                          <span className="mb-1.5 block text-sm font-medium text-gray-700">Currency</span>
                          <RequestFormCurrencySelect
                            value={formData.budgetCurrency}
                            onChange={(c) => setFormData({ ...formData, budgetCurrency: c })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {stepId === "message" && (
                    <div>
                      <h2 className="mb-1 text-xl font-semibold text-gray-900">
                        {requestType === "client-rent" && "Anything else?"}
                        {requestType === "client-other" && "Your question"}
                        {requestType === "owner" && "Tell us about the property"}
                        {requestType === "specialist" && "How can you help?"}
                      </h2>
                      <p className="mb-4 text-sm text-gray-500">
                        {requestType === "client-rent" && "Optional details: timing, must-haves, link to a listing…"}
                        {requestType === "client-other" && "Write your question — we read every message."}
                        {requestType === "owner" && "Describe the property, title status, and how you want to work with us."}
                        {requestType === "specialist" && "Briefly describe your services and experience."}
                      </p>
                      <textarea
                        required={requestType !== "client-rent"}
                        rows={requestType === "client-rent" ? 4 : 5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        placeholder="Type here…"
                      />
                    </div>
                  )}

                  {submitError && <p className="text-sm text-red-600">{submitError}</p>}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onPrimary}
                      disabled={submitting}
                      className="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Sending…" : isLastStep ? "Send request" : "Continue"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-lg">
              <h1 className="mb-4 text-3xl font-bold text-gray-900">Send a request</h1>
              <p className="text-gray-600">Loading…</p>
            </div>
          </div>
        </div>
      }
    >
      <RequestForm />
    </Suspense>
  );
}
