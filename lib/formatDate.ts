const localeDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Site-wide display: DD/MM/YYYY (e.g. 26/01/2026), independent of browser locale. */
export function formatLocaleDate(iso: string | number | Date): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return localeDateFormatter.format(d);
}
