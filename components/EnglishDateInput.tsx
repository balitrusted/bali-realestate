"use client";

import { sanitizeEnglishDateInput } from "@/lib/englishDateInput";

type EnglishDateInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  showHint?: boolean;
};

export default function EnglishDateInput({
  id,
  value,
  onChange,
  className,
  required,
  showHint = true,
}: EnglishDateInputProps) {
  return (
    <div>
      <input
        id={id}
        type="text"
        lang="en"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={value}
        onChange={(e) => onChange(sanitizeEnglishDateInput(e.target.value))}
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        title="Date in YYYY-MM-DD format"
        className={className}
      />
      {showHint ? <p className="mt-1 text-xs text-gray-500">Format: YYYY-MM-DD</p> : null}
    </div>
  );
}
