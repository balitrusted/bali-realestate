import { NextResponse } from "next/server";
import {
  FALLBACK_USD_RATES,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/currency";

export const revalidate = 60 * 60 * 24; // 24h

type FxApiResponse = {
  result?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

export async function GET() {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) throw new Error("Failed to fetch FX rates");
    const data = (await res.json()) as FxApiResponse;
    if (!data?.rates) throw new Error("Invalid FX payload");

    const rates = Object.fromEntries(
      SUPPORTED_CURRENCIES.map((c) => [c, Number(data.rates?.[c] ?? FALLBACK_USD_RATES[c])])
    ) as Record<SupportedCurrency, number>;
    rates.USD = 1;

    return NextResponse.json({
      base: "USD",
      updatedAt: data.time_last_update_utc || new Date().toISOString(),
      rates,
    });
  } catch {
    return NextResponse.json({
      base: "USD",
      updatedAt: new Date().toISOString(),
      rates: FALLBACK_USD_RATES,
      fallback: true,
    });
  }
}
