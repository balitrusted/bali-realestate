"use client";

import type { ChangeEvent } from "react";
import { useTheme } from "@/components/ThemeProvider";

export default function ThemeSwitcher({ mobile = false }: { mobile?: boolean }) {
  const { mode, setMode } = useTheme();
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "auto" || value === "light" || value === "dark") setMode(value);
  };
  return (
    <label className={`inline-flex items-center gap-1.5 ${mobile ? "w-full" : ""}`}>
      <span className="text-sm text-gray-600" aria-hidden="true">
        {mode === "auto" ? "◐" : mode === "dark" ? "☾" : "☀"}
      </span>
      <select
        aria-label="Color theme"
        value={mode}
        onChange={handleChange}
        className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
      >
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
