"use client";

import { useCurrency } from "@/components/CurrencyProvider";
import {
  convertAmount,
  formatMoney,
  type SupportedCurrency,
} from "@/lib/currency";

export default function PriceText({
  amount,
  sourceCurrency,
  className,
}: {
  amount: number;
  sourceCurrency: SupportedCurrency;
  className?: string;
}) {
  const { currency, rates } = useCurrency();
  const converted = convertAmount(amount, sourceCurrency, currency, rates);
  return <span className={className}>{formatMoney(converted, currency)}</span>;
}
