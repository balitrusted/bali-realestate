"use client";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseYmd(value: string | null | undefined): { y: number; m: number; d: number } | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [ys, ms, ds] = value.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  if (!Number.isFinite(y) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function toYmd(y: number, m: number, d: number): string {
  const maxD = daysInMonth(y, m);
  const safeD = Math.min(Math.max(1, d), maxD);
  return `${y}-${String(m).padStart(2, "0")}-${String(safeD).padStart(2, "0")}`;
}

const selectClass =
  "px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-900 focus:ring-gray-500 focus:border-gray-500";

type AdminDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minYear?: number;
  maxYear?: number;
};

/** English month names — avoids OS-locale native date picker (e.g. Russian on Windows). */
export default function AdminDateInput({
  value,
  onChange,
  className = "",
  minYear,
  maxYear,
}: AdminDateInputProps) {
  const today = new Date();
  const parsed = parseYmd(value) ?? {
    y: today.getFullYear(),
    m: today.getMonth() + 1,
    d: today.getDate(),
  };
  const yearMin = minYear ?? today.getFullYear() - 1;
  const yearMax = maxYear ?? today.getFullYear() + 6;
  const years = Array.from({ length: yearMax - yearMin + 1 }, (_, i) => yearMin + i);
  const dayCount = daysInMonth(parsed.y, parsed.m);

  const emit = (y: number, m: number, d: number) => {
    onChange(toYmd(y, m, d));
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} lang="en">
      <select
        aria-label="Day"
        className={selectClass}
        value={Math.min(parsed.d, dayCount)}
        onChange={(e) => emit(parsed.y, parsed.m, Number(e.target.value))}
      >
        {Array.from({ length: dayCount }, (_, i) => i + 1).map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>
      <select
        aria-label="Month"
        className={selectClass}
        value={parsed.m}
        onChange={(e) => emit(parsed.y, Number(e.target.value), parsed.d)}
      >
        {MONTH_LABELS.map((label, i) => (
          <option key={label} value={i + 1}>
            {label}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        className={selectClass}
        value={parsed.y}
        onChange={(e) => emit(Number(e.target.value), parsed.m, parsed.d)}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}

type AdminDatetimeLocalInputProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** Date (English selects) + time for admin publish datetime. */
export function AdminDatetimeLocalInput({ value, onChange, className = "" }: AdminDatetimeLocalInputProps) {
  const [datePart, rawTime] = value.includes("T") ? value.split("T") : [value, "12:00"];
  const timePart = (rawTime || "12:00").slice(0, 5);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} lang="en">
      <AdminDateInput
        value={datePart || new Date().toISOString().slice(0, 10)}
        onChange={(d) => onChange(`${d}T${timePart}`)}
      />
      <input
        type="time"
        lang="en"
        value={timePart}
        onChange={(e) => onChange(`${datePart || new Date().toISOString().slice(0, 10)}T${e.target.value}`)}
        className={selectClass}
        aria-label="Time"
      />
    </div>
  );
}
