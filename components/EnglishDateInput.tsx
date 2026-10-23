"use client";

type EnglishDateInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  min?: string;
};

export default function EnglishDateInput({
  id,
  value,
  onChange,
  className,
  required,
  min,
}: EnglishDateInputProps) {
  return (
    <input
      id={id}
      type="date"
      lang="en"
      required={required}
      min={min}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
}
