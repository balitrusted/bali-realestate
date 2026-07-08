"use client";

import { useState } from "react";
import EnglishDateInput from "@/components/EnglishDateInput";
import { isValidEnglishIsoDate } from "@/lib/englishDateInput";

interface NotifyWhenAvailableFormProps {
  propertyId: string;
  propertyTitle: string;
}

export default function NotifyWhenAvailableForm({ propertyId, propertyTitle }: NotifyWhenAvailableFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      if (dateFrom.trim() && !isValidEnglishIsoDate(dateFrom.trim())) {
        throw new Error("Enter a valid date (YYYY-MM-DD)");
      }
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
      <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
        <p className="font-medium text-emerald-800">Request submitted successfully.</p>
        <p className="text-emerald-700 text-sm mt-1">We will notify you at your email when this villa becomes available.</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
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
          <label htmlFor="notify-date" className="block text-sm font-medium text-gray-700 mb-1">Needed from (optional)</label>
          <EnglishDateInput
            id="notify-date"
            value={dateFrom}
            onChange={setDateFrom}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={sending}
          className="w-full px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium disabled:opacity-50"
        >
          {sending ? "Sending…" : "Notify me when available"}
        </button>
      </form>
    </div>
  );
}
