"use client";

import { CURRENCY_OPTIONS, useCurrency } from "@/components/CurrencyProvider";
import { CURRENCY_LABELS, type SupportedCurrency } from "@/lib/currency";

export default function CurrencySwitcher({ mobile = false }: { mobile?: boolean }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <label className={`inline-flex items-center gap-2 ${mobile ? "w-full" : ""}`}>
      <span className="text-xs uppercase tracking-wide text-gray-500">Currency</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-emerald-600 focus:outline-none"
      >
        {CURRENCY_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {`${CURRENCY_LABELS[c].symbol} ${c} - ${CURRENCY_LABELS[c].name}`}
          </option>
        ))}
      </select>
    </label>
  );
}
