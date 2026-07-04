import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabaseServer";
import type { PropertyFieldChange } from "@/lib/propertyChangeDiff";

export type PropertyEventType =
  | "created"
  | "updated"
  | "archived"
  | "restored"
  | "deleted";

export interface PropertyEvent {
  id: string;
  propertyId: string;
  eventType: PropertyEventType;
  comment?: string;
  changedFields?: Record<string, PropertyFieldChange>;
  createdAt: string;
}

type PropertyEventRow = {
  id: string;
  property_id: string;
  event_type: PropertyEventType;
  comment: string | null;
  changed_fields: Record<string, PropertyFieldChange> | null;
  created_at: string;
};

function mapRowToEvent(row: PropertyEventRow): PropertyEvent {
  return {
    id: row.id,
    propertyId: row.property_id,
    eventType: row.event_type,
    comment: row.comment ?? undefined,
    changedFields: row.changed_fields ?? undefined,
    createdAt: row.created_at,
  };
}

function createEventId(): string {
  return `pe-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function appendPropertyEvent(input: {
  propertyId: string;
  eventType: PropertyEventType;
  comment?: string;
  changedFields?: Record<string, PropertyFieldChange>;
}): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.warn("[property_events] Supabase not configured; event skipped", {
      propertyId: input.propertyId,
      eventType: input.eventType,
    });
    return;
  }

  const row = {
    id: createEventId(),
    property_id: input.propertyId,
    event_type: input.eventType,
    comment: input.comment?.trim() || null,
    changed_fields: input.changedFields ?? null,
    created_at: new Date().toISOString(),
  };

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("property_events").insert(row);
  if (error) {
    throw new Error(`[property_events] write failed: ${error.message}`);
  }
}

export async function getPropertyEvents(propertyId: string): Promise<PropertyEvent[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("property_events")
    .select("id, property_id, event_type, comment, changed_fields, created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`[property_events] read failed: ${error.message}`);
  }

  return ((data as PropertyEventRow[] | null) ?? []).map(mapRowToEvent);
}

export async function safeAppendPropertyEvent(
  input: Parameters<typeof appendPropertyEvent>[0]
): Promise<void> {
  try {
    await appendPropertyEvent(input);
  } catch (error) {
    console.error("[property_events] failed to append event", {
      propertyId: input.propertyId,
      eventType: input.eventType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
