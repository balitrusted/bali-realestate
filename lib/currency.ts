export const SUPPORTED_CURRENCIES = [
  "IDR",
  "USD",
  "EUR",
  "RUB",
  "UAH",
  "GBP",
  "AUD",
  "CAD",
  "NZD",
  "SGD",
  "HKD",
  "JPY",
  "KRW",
  "CNY",
  "INR",
  "AED",
  "SAR",
  "QAR",
  "TRY",
  "THB",
  "MYR",
  "PHP",
  "VND",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "IDR";

export const FALLBACK_USD_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  AUD: 1.53,
  CAD: 1.36,
  NZD: 1.67,
  SGD: 1.34,
  HKD: 7.82,
  JPY: 151.0,
  KRW: 1330.0,
  CNY: 7.2,
  RUB: 92.0,
  UAH: 41.0,
  INR: 83.0,
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  TRY: 33.0,
  THB: 36.0,
  MYR: 4.7,
  IDR: 16250.0,
  PHP: 57.0,
  VND: 25500.0,
  CHF: 0.89,
  SEK: 10.4,
  NOK: 10.7,
  DKK: 6.9,
};

export function isSupportedCurrency(v: string): v is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(v as SupportedCurrency);
}

export function convertAmount(
  amount: number,
  source: SupportedCurrency,
  target: SupportedCurrency,
  usdRates: Record<SupportedCurrency, number>
): number {
  if (source === target) return amount;
  const sourceRate = usdRates[source];
  const targetRate = usdRates[target];
  if (!sourceRate || !targetRate) return amount;
  const amountInUsd = amount / sourceRate;
  return amountInUsd * targetRate;
}

export function formatMoney(amount: number, currency: SupportedCurrency): string {
  const rounded = roundMoney(amount, currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
}

export const CURRENCY_LABELS: Record<
  SupportedCurrency,
  { name: string; symbol: string }
> = {
  IDR: { name: "Indonesian Rupiah", symbol: "Rp" },
  USD: { name: "US Dollar", symbol: "$" },
  EUR: { name: "Euro", symbol: "€" },
  RUB: { name: "Russian Ruble", symbol: "₽" },
  UAH: { name: "Ukrainian Hryvnia", symbol: "₴" },
  GBP: { name: "British Pound", symbol: "£" },
  AUD: { name: "Australian Dollar", symbol: "A$" },
  CAD: { name: "Canadian Dollar", symbol: "C$" },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  CNY: { name: "Chinese Yuan", symbol: "¥" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  AED: { name: "UAE Dirham", symbol: "د.إ" },
  SAR: { name: "Saudi Riyal", symbol: "﷼" },
  QAR: { name: "Qatari Riyal", symbol: "﷼" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
  THB: { name: "Thai Baht", symbol: "฿" },
  MYR: { name: "Malaysian Ringgit", symbol: "RM" },
  PHP: { name: "Philippine Peso", symbol: "₱" },
  VND: { name: "Vietnamese Dong", symbol: "₫" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  SEK: { name: "Swedish Krona", symbol: "kr" },
  NOK: { name: "Norwegian Krone", symbol: "kr" },
  DKK: { name: "Danish Krone", symbol: "kr" },
};

const CURRENCY_ROUNDING_STEP: Partial<Record<SupportedCurrency, number>> = {
  IDR: 1000,
  VND: 1000,
  KRW: 100,
  JPY: 100,
};

export function roundMoney(amount: number, currency: SupportedCurrency): number {
  const step = CURRENCY_ROUNDING_STEP[currency] ?? 1;
  return Math.round(amount / step) * step;
}
