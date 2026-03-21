/** Soft emerald fade line between catalog sections (matches /properties top divider). */
export default function CatalogListingDivider({ className }: { className?: string }) {
  return (
    <div
      className={[
        "h-px w-full bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden
    />
  );
}
