"use client";

import { useState } from "react";

interface CatalogFiltersToggleProps {
  children: React.ReactNode;
  hideButton?: boolean;
}

export default function CatalogFiltersToggle({ children, hideButton }: CatalogFiltersToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-catalog-filters-toggle
        className={
          hideButton
            ? "sr-only"
            : "w-full mb-4 flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-btn-hatch-soft text-sm font-medium text-gray-700 transition-[border-color] duration-200"
        }
      >
        <span>{open ? "Hide filters" : "Show all filters"}</span>
        <svg
          className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
