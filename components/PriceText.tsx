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
  showApprox = true,
}: {
  amount: number;
  sourceCurrency: SupportedCurrency;
  className?: string;
  showApprox?: boolean;
}) {
  const { currency, rates } = useCurrency();
  const converted = convertAmount(amount, sourceCurrency, currency, rates);
  const hasConversion = sourceCurrency !== currency;
  const approxPrefix = showApprox && hasConversion ? "≈ " : "";
  const title = hasConversion ? `Converted from ${sourceCurrency}` : undefined;
  return (
    <span className={className} title={title}>
      {`${approxPrefix}${formatMoney(converted, currency)}`}
    </span>
  );
}
