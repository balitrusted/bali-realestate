"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";

export type ThemeMode = "auto" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "balitrusted-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "auto" || value === "light" || value === "dark";
}

function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  const storedMode = localStorage.getItem(STORAGE_KEY);
  return isThemeMode(storedMode) ? storedMode : "auto";
}

function subscribeToThemeChanges(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("balitrusted-theme-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("balitrusted-theme-change", onChange);
  };
}

function getResolvedTheme(): ResolvedTheme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== "auto") return mode;
  const hour = new Date().getHours();
  return hour >= 19 || hour < 7 ? "dark" : "light";
}

function getServerMode(): ThemeMode {
  return "auto";
}

function getServerResolvedTheme(): ResolvedTheme {
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribeToThemeChanges, getStoredMode, getServerMode);
  const resolvedTheme = useSyncExternalStore(
    subscribeToThemeChanges,
    getResolvedTheme,
    getServerResolvedTheme
  );

  const applyTheme = useCallback((nextMode: ThemeMode) => {
    const theme = resolveTheme(nextMode);
    if (document.documentElement.dataset.theme !== theme) {
      document.documentElement.dataset.theme = theme;
      window.dispatchEvent(new Event("balitrusted-theme-change"));
    }
  }, []);

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      localStorage.setItem(STORAGE_KEY, nextMode);
      applyTheme(nextMode);
      window.dispatchEvent(new Event("balitrusted-theme-change"));
    },
    [applyTheme]
  );

  useEffect(() => {
    applyTheme(mode);
    const updateAutoTheme = () => applyTheme(mode);
    const intervalId = window.setInterval(updateAutoTheme, 60_000);
    window.addEventListener("focus", updateAutoTheme);
    document.addEventListener("visibilitychange", updateAutoTheme);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", updateAutoTheme);
      document.removeEventListener("visibilitychange", updateAutoTheme);
    };
  }, [applyTheme, mode]);

  const value = useMemo(() => ({ mode, resolvedTheme, setMode }), [mode, resolvedTheme, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
