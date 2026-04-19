"use client";

/** iOS-style toggle: green when checked, gray when off. */
export default function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
  compact,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
  /** Tighter padding, smaller label and control (e.g. catalog amenities). */
  compact?: boolean;
}) {
  const pad = compact ? "py-2.5" : "py-2.5";
  const labelCls = compact
    ? "text-sm font-normal text-stone-600 group-hover:text-stone-800 min-w-0 pr-2"
    : "text-sm font-normal text-gray-700 group-hover:text-gray-800";
  const trackCls = compact
    ? "h-5 w-9 shrink-0 border border-transparent self-center"
    : "h-7 w-12 border-2 border-transparent";
  const thumbCls = compact ? "h-4 w-4" : "h-6 w-6";
  const thumbX = compact ? (checked ? "translate-x-4" : "translate-x-0.5") : checked ? "translate-x-5" : "translate-x-0.5";

  return (
    <label
      htmlFor={id}
      className={`flex w-full items-center justify-between gap-3 ${pad} cursor-pointer group ${compact ? "px-0.5" : ""}`}
    >
      <span className={labelCls}>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex shrink-0 rounded-full
          transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1
          active:scale-[0.98]
          ${trackCls}
          ${checked ? "bg-emerald-500 hover:bg-emerald-600" : "bg-stone-200 hover:bg-stone-300"}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block transform rounded-full bg-white shadow-sm ring-0
            transition-transform duration-300 ease-out
            ${thumbCls}
            ${thumbX}
          `}
        />
      </button>
    </label>
  );
}
