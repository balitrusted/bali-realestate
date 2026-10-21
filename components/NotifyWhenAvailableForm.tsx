"use client";

import { useEffect, useRef, useState } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDateForDisplay(value: string): string {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "DD/MM/YYYY";
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface NotifyWhenAvailableFormProps {
  propertyId: string;
  propertyTitle: string;
}

export default function NotifyWhenAvailableForm({ propertyId, propertyTitle }: NotifyWhenAvailableFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(true);
  const [error, setError] = useState("");
  const calendarRef = useRef<HTMLDivElement>(null);

  const calendarYear = visibleMonth.getFullYear();
  const calendarMonth = visibleMonth.getMonth();
  const leadingDays = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarCellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7;
  const currentYear = new Date().getFullYear();
  const firstYear = Math.min(currentYear - 80, calendarYear);
  const lastYear = Math.max(currentYear + 30, calendarYear);

  useEffect(() => {
    if (!calendarOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!calendarRef.current?.contains(event.target as Node)) setCalendarOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCalendarOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [calendarOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/notify-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          propertyTitle,
          name: name.trim(),
          email: email.trim(),
          dateFrom: dateFrom || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setConfirmationSent(data.confirmationSent !== false);
      setSent(true);
      setName("");
      setEmail("");
      setDateFrom("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div id="notify-when-available" className="scroll-mt-24 p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
        <p className="font-medium text-emerald-800">Subscription saved.</p>
        <p className="text-emerald-700 text-sm mt-1">
          {confirmationSent
            ? "A confirmation email is on its way. We will notify you when this villa becomes available."
            : "We could not send a confirmation email. Please check your email address or try again later."}
        </p>
      </div>
    );
  }

  return (
    <div id="notify-when-available" className="scroll-mt-24 border border-gray-200 rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Notify me when available</h3>
      <p className="text-sm text-gray-600 mb-4">Leave your details and we will email you when this villa is available again.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="notify-name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            id="notify-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="notify-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            id="notify-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <p id="notify-date-label" className="block text-sm font-medium text-gray-700 mb-1">Needed from (optional)</p>
          <div className="relative" ref={calendarRef}>
            <button
              id="notify-date"
              type="button"
              aria-labelledby="notify-date-label"
              aria-haspopup="dialog"
              aria-expanded={calendarOpen}
              onClick={() => {
                if (!calendarOpen) {
                  if (dateFrom) {
                    const [year, month] = dateFrom.split("-").map(Number);
                    setVisibleMonth(new Date(year, month - 1, 1));
                  } else {
                    const today = new Date();
                    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                  }
                }
                setCalendarOpen((open) => !open);
              }}
              className="flex min-h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-1"
            >
              <span className={dateFrom ? "text-gray-900" : "text-gray-400"}>
                {formatDateForDisplay(dateFrom)}
              </span>
              <span className="text-gray-600">Choose date</span>
            </button>
            {calendarOpen && (
              <div
                role="dialog"
                aria-label="Choose needed-from date"
                className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-3rem)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
              >
                <div className="mb-3 flex items-center gap-2">
                  <select
                    aria-label="Month"
                    value={calendarMonth}
                    onChange={(event) => setVisibleMonth(new Date(calendarYear, Number(event.target.value), 1))}
                    className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900"
                  >
                    {MONTH_NAMES.map((month, index) => (
                      <option key={month} value={index}>{month}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Year"
                    value={calendarYear}
                    onChange={(event) => setVisibleMonth(new Date(Number(event.target.value), calendarMonth, 1))}
                    className="w-24 rounded border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-900"
                  >
                    {Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-7 text-center">
                  {WEEKDAY_NAMES.map((weekday) => (
                    <span key={weekday} className="py-1 text-xs font-medium text-gray-500">{weekday}</span>
                  ))}
                  {Array.from({ length: calendarCellCount }, (_, index) => {
                    const day = index - leadingDays + 1;
                    if (day < 1 || day > daysInMonth) {
                      return <span key={`empty-${index}`} />;
                    }
                    const isoDate = toIsoDate(calendarYear, calendarMonth, day);
                    const selected = isoDate === dateFrom;
                    return (
                      <button
                        key={isoDate}
                        type="button"
                        aria-label={`${day} ${MONTH_NAMES[calendarMonth]} ${calendarYear}`}
                        aria-pressed={selected}
                        onClick={() => {
                          setDateFrom(isoDate);
                          setCalendarOpen(false);
                        }}
                        className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm transition-colors ${
                          selected
                            ? "bg-gray-900 font-semibold text-white"
                            : "text-gray-800 hover:bg-emerald-50"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={sending}
          className="w-full px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
        >
          {sending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
    </div>
  );
}
