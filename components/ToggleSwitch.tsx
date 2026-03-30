"use client";

/** iOS-style toggle: green when checked, gray when off. */
export default function ToggleSwitch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
}) {
  return (
    <label
      htmlFor={id}
      className="inline-flex w-auto max-w-full items-center gap-2.5 py-1.5 cursor-pointer group"
    >
      <span className="text-sm font-normal text-gray-700 group-hover:text-gray-900">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent
          transition-colors duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
          active:scale-[0.98]
          ${checked ? "bg-emerald-500 hover:bg-emerald-600" : "bg-gray-200 hover:bg-gray-300"}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0
            transition-transform duration-300 ease-out
            ${checked ? "translate-x-5" : "translate-x-0.5"}
          `}
        />
      </button>
    </label>
  );
}
