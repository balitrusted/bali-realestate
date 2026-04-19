"use client";

import type { ComponentPropsWithoutRef } from "react";
import type { SupportedCurrency } from "@/lib/currency";

/** Admin forms historically used IDR/USD only; formatting supports the full site currency set. */
export type AdminPriceCurrency = "IDR" | "USD";

/** Keep only digits; undefined if empty */
export function parseDigitsToInt(raw: string): number | undefined {
  const d = raw.replace(/\D/g, "");
  if (!d) return undefined;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? n : undefined;
}

export function formatPriceDigits(
  n: number | undefined,
  currency: SupportedCurrency | AdminPriceCurrency
): string {
  if (n === undefined || n === null || Number.isNaN(n)) return "";
  const locale = currency === "IDR" ? "id-ID" : "en-US";
  return n.toLocaleString(locale, { maximumFractionDigits: 0, useGrouping: true });
}

type PriceInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "value" | "defaultValue" | "onChange" | "inputMode"
> & {
  value: number | undefined;
  onValueChange: (v: number | undefined) => void;
  currency: SupportedCurrency | AdminPriceCurrency;
};

/**
 * Integer price field with thousand separators while typing (IDR: 15.000.000, USD: 15,000,000).
 */
export function PriceInput({
  value,
  onValueChange,
  currency,
  className,
  ...rest
}: PriceInputProps) {
  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatPriceDigits(value, currency)}
      onChange={(e) => onValueChange(parseDigitsToInt(e.target.value))}
      className={className}
    />
  );
}
