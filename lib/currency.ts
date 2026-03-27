export const SUPPORTED_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "NZD",
  "SGD",
  "HKD",
  "JPY",
  "KRW",
  "CNY",
  "RUB",
  "UAH",
  "INR",
  "AED",
  "SAR",
  "QAR",
  "TRY",
  "THB",
  "MYR",
  "IDR",
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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
