"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import {
  DEFAULT_PHONE_COUNTRY,
  getPhoneCountries,
  toValidE164,
  type PhoneCountry,
} from "@/lib/phone";

type Props = {
  /** Previously entered valid number (E.164), restored when the form step is re-opened. */
  initialValue?: string;
  /** Called on every change; `e164` is null until the number is complete and valid. */
  onChange: (state: { e164: string | null; hasInput: boolean }) => void;
  inputClassName?: string;
  id?: string;
};

function detectCountry(countries: PhoneCountry[]): CountryCode {
  const region = typeof navigator !== "undefined" ? navigator.language?.split("-")[1]?.toUpperCase() : undefined;
  return countries.find((c) => c.iso === region)?.iso ?? DEFAULT_PHONE_COUNTRY;
}

export default function PhoneInput({ initialValue, onChange, inputClassName = "", id }: Props) {
  const countries = useMemo(() => getPhoneCountries(), []);
  const initial = useMemo(() => (initialValue ? parsePhoneNumberFromString(initialValue) : undefined), [initialValue]);
  const [country, setCountry] = useState<CountryCode>(initial?.country ?? DEFAULT_PHONE_COUNTRY);
  const [national, setNational] = useState(initial?.nationalNumber ?? "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!initial?.country) setCountry(detectCountry(countries));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);

  useEffect(() => {
    onChange({ e164: toValidE164(country, national), hasInput: national.replace(/\D/g, "").length > 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, national]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selected = countries.find((c) => c.iso === country);
  const q = query.trim().toLowerCase().replace(/^\+/, "");
  const filtered = q
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.dialCode.startsWith(q) || c.iso.toLowerCase() === q
      )
    : countries;

  return (
    <div ref={rootRef} className="relative flex gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country code: ${selected?.name ?? ""}`}
        className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-50"
      >
        <span className="font-medium">{selected?.iso}</span>
        <span className="text-gray-600">+{selected?.dialCode}</span>
        <span aria-hidden className="text-xs text-gray-400">▾</span>
      </button>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={national}
        onChange={(e) => setNational(e.target.value.replace(/[^\d\s-]/g, ""))}
        placeholder="Phone number"
        className={inputClassName}
      />
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-72 max-w-[85vw] rounded-lg border border-gray-200 bg-white shadow-lg">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country or code"
            className="w-full rounded-t-lg border-b border-gray-200 px-3 py-2 text-sm focus:outline-none"
          />
          <ul role="listbox" className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
            ) : (
              filtered.map((c) => (
                <li key={c.iso} role="option" aria-selected={c.iso === country}>
                  <button
                    type="button"
                    onClick={() => {
                      setCountry(c.iso);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                      c.iso === country ? "bg-emerald-50 font-medium" : ""
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 text-gray-500">+{c.dialCode}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
