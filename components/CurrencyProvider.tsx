"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_CURRENCY,
  FALLBACK_USD_RATES,
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
  isSupportedCurrency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  rates: Record<SupportedCurrency, number>;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "balitrusted.currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<SupportedCurrency, number>>(FALLBACK_USD_RATES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isSupportedCurrency(saved)) {
        setCurrencyState(saved);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    fetch("/api/fx-rates", { cache: "force-cache" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.rates) setRates(d.rates as Record<SupportedCurrency, number>);
      })
      .catch(() => {
        // no-op: keep fallback
      });
  }, []);

  const setCurrency = (c: SupportedCurrency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // no-op
    }
  };

  const value = useMemo(() => ({ currency, setCurrency, rates }), [currency, rates]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: DEFAULT_CURRENCY,
      setCurrency: () => {},
      rates: FALLBACK_USD_RATES,
    };
  }
  return ctx;
}

export const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES;
