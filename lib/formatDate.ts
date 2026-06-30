const localeDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Site-wide display: D MMM YYYY (e.g. 11 Jul 2026).
 * Unambiguous for US vs UK readers — no numeric month/day swap.
 */
export function formatLocaleDate(iso: string | number | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return localeDateFormatter.format(d);
}
