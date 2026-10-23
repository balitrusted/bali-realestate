/** Archive reasons shown in admin (English UI). */

export type PropertyArchiveReason =
  | "rented_by_us"
  | "owner_rented"
  | "moved_to_management"
  | "rented_by_another_agent"
  | "low_quality_listing"
  | "no_longer_promoting";

export const PROPERTY_ARCHIVE_REASONS: {
  value: PropertyArchiveReason;
  label: string;
}[] = [
  { value: "rented_by_us", label: "Rented by us" },
  { value: "owner_rented", label: "Owner rented themselves" },
  { value: "moved_to_management", label: "Moved to management" },
  { value: "rented_by_another_agent", label: "Rented by another agent" },
  { value: "low_quality_listing", label: "Low-quality listing" },
  { value: "no_longer_promoting", label: "No longer want to promote" },
];

export function formatArchiveHistoryComment(
  reason: PropertyArchiveReason,
  guestName?: string
): string {
  const label =
    PROPERTY_ARCHIVE_REASONS.find((r) => r.value === reason)?.label ?? reason;
  const guest = guestName?.trim();
  if (reason === "rented_by_us" && guest) {
    return `${label} — Guest: ${guest}`;
  }
  return label;
}
