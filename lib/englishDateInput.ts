const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidEnglishIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function sanitizeEnglishDateInput(value: string): string {
  return value.replace(/[^\d-]/g, "").slice(0, 10);
}
