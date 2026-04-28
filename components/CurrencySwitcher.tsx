"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CURRENCY_OPTIONS, useCurrency } from "@/components/CurrencyProvider";
import { CURRENCY_LABELS, type SupportedCurrency } from "@/lib/currency";

export default function CurrencySwitcher({ mobile = false }: { mobile?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});

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

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const menuWidth = mobile ? Math.max(rect.width, 220) : 220;
      const left = mobile
        ? Math.max(8, Math.min(rect.left, viewportWidth - menuWidth - 8))
        : Math.max(8, rect.right - menuWidth);
      const top = rect.bottom + 6;
      const maxHeight = Math.max(160, viewportHeight - top - 8);
      setMenuStyle({
        position: "fixed",
        top,
        left,
        width: menuWidth,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, mobile]);

  const cur = CURRENCY_LABELS[currency];

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex items-center gap-1.5 ${mobile ? "w-full" : ""}`}
    >
      <span className="text-[10px] uppercase tracking-wide text-gray-500 shrink-0">Currency</span>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center justify-between gap-1 rounded-md border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 shadow-sm hover:border-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600/30 ${mobile ? "min-w-0 flex-1" : "min-w-[5.25rem]"}`}
      >
        <span className="tabular-nums font-medium">
          {cur.symbol} {currency}
        </span>
        <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul
          role="listbox"
          style={menuStyle}
          className="z-[140] overflow-y-auto overscroll-contain rounded-md border border-gray-200 bg-white py-1 text-left shadow-lg"
        >
          {CURRENCY_OPTIONS.map((c) => {
            const { symbol, name } = CURRENCY_LABELS[c];
            const selected = c === currency;
            return (
              <li key={c} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency(c as SupportedCurrency);
                    setOpen(false);
                  }}
                  className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-gray-50 ${selected ? "bg-emerald-50/80" : ""}`}
                >
                  <span className="font-medium text-gray-900">
                    {symbol} {c}
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
