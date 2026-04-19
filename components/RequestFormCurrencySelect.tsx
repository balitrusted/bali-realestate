"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENCY_OPTIONS } from "@/components/CurrencyProvider";
import { CURRENCY_LABELS, type SupportedCurrency } from "@/lib/currency";

/** Same currency list as the site header switcher, for request / budget fields. */
export function RequestFormCurrencySelect({
  value,
  onChange,
  className = "",
  id,
}: {
  value: SupportedCurrency;
  onChange: (c: SupportedCurrency) => void;
  className?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const cur = CURRENCY_LABELS[value];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex w-full min-w-[6.5rem] items-center justify-between gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-sm hover:border-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
      >
        <span className="tabular-nums font-medium">
          {cur.symbol} {value}
        </span>
        <svg className="h-4 w-4 shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-[80] mt-1 max-h-56 min-w-[12rem] overflow-auto rounded-lg border border-gray-200 bg-white py-1 text-left shadow-lg"
        >
          {CURRENCY_OPTIONS.map((c) => {
            const cc = c as SupportedCurrency;
            const { symbol, name } = CURRENCY_LABELS[cc];
            const selected = cc === value;
            return (
              <li key={c} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(cc);
                    setOpen(false);
                  }}
                  className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-gray-50 ${selected ? "bg-emerald-50/80" : ""}`}
                >
                  <span className="font-medium text-gray-900">
                    {symbol} {cc}
                  </span>
                  <span className="text-xs text-gray-500">{name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
