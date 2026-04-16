"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Property } from "@/types/property";
import { propertyHasUnknownAmenities } from "@/lib/featureState";
import PropertyImageWithFallback from "@/components/PropertyImageWithFallback";
import { getPropertyDisplayTitle, fixDescriptionDisplay } from "@/lib/propertyUtils";
import { formatLocaleDate } from "@/lib/formatDate";
import { subAreaNames, SUBAREA_UNSPECIFIED_LABEL } from "@/types/areas";

type MutationListsPayload = {
  properties?: Property[];
  archivedProperties?: Property[];
  error?: string;
};

function formatPrice(price: number, currency: string) {
  if (currency === "IDR") {
    return `${(price / 1000000).toFixed(0)}M IDR`;
  }
  return `$${price.toLocaleString()}`;
}

function getPayloadError(payload: MutationListsPayload, fallback = "Failed"): string {
  return typeof payload?.error === "string" ? payload.error : fallback;
}

function SortablePropertyItem({
  property,
  selected,
  archiving,
  onToggleSelected,
  onArchive,
}: {
  property: Property;
  selected: boolean;
  archiving: boolean;
  onToggleSelected: (propertyId: string) => void;
  onArchive: (property: Property) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || archiving ? 0.5 : 1,
  };

  const mainImage = property.images && property.images.length > 0
    ? property.images[0]
    : null;
  const price = property.price || { min: 0, currency: "IDR" as const };
  const forSale = property.types?.includes("sale") && price.forSale != null && price.forSale > 0;
  const hasRentPrice =
    (price.min != null && price.min > 0) || price.monthly != null || price.yearly != null;
  const priceDisplay = forSale
    ? `${formatPrice(price.forSale!, price.currency || "IDR")} (sale)`
    : hasRentPrice
      ? price.yearly != null && price.yearly > 0
        ? `${formatPrice(price.yearly, price.currency || "IDR")} / year`
        : `${formatPrice(price.monthly ?? price.min ?? 0, price.currency || "IDR")}${price.monthly != null ? " / month" : ""}`
      : "Price not set";
  const amenitiesIncomplete = propertyHasUnknownAmenities(property.features);

  return (
    <div
      ref={setNodeRef}
      id={`property-${property.id}`}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center gap-4"
    >
      <label className="self-start pt-1">
        <input
          type="checkbox"
          checked={selected}
          disabled={archiving}
          onChange={() => onToggleSelected(property.id)}
          className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
          aria-label={`Select ${getPropertyDisplayTitle(property)}`}
        />
      </label>

      <div
        {...attributes}
        {...listeners}
        className={`text-gray-400 hover:text-gray-600 ${archiving ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {mainImage ? (
        <div className="w-24 h-24 relative rounded overflow-hidden flex-shrink-0">
          <PropertyImageWithFallback
            src={mainImage}
            alt={getPropertyDisplayTitle(property)}
            fill
            className="object-cover"
            sizes="96px"
            placeholderText="No image"
          />
        </div>
      ) : (
        <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-gray-400">No image</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate min-w-0 flex-1">
            {property.internalName?.trim() || getPropertyDisplayTitle(property)}
          </h3>
          {amenitiesIncomplete ? (
            <span
              role="img"
              aria-label="Incomplete amenities: some features still No info"
              className="inline-flex shrink-0 h-2.5 w-2.5 rounded-sm bg-amber-400 ring-2 ring-amber-200/90 shadow-sm"
              title="Some amenities still “No info” — open Edit to complete"
            />
          ) : null}
        </div>
        {property.internalName?.trim() && (
          <p className="text-xs text-gray-500 truncate">{getPropertyDisplayTitle(property)}</p>
        )}
        <p className="text-sm text-gray-600 truncate">
          {fixDescriptionDisplay(property.description) || "No description"}
        </p>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
          <span>{property.bedrooms || 0} bedrooms</span>
          <span>
            {property.subArea
              ? (subAreaNames[property.subArea] || property.subArea)
              : SUBAREA_UNSPECIFIED_LABEL}
          </span>
          {property.types && property.types.length > 0 && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {property.types.join(", ")}
            </span>
          )}
          <span className="font-semibold text-gray-900">{priceDisplay}</span>
          <span className="text-xs">
            Availability: {property.availableFrom ? formatLocaleDate(property.availableFrom) : "Now"}
          </span>
          <span className="text-xs">Order: {property.order ?? 999}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        <Link
          href={`/admin/properties/edit/${property.id}`}
          className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm text-center whitespace-nowrap block"
          onClick={() => {
            if (typeof sessionStorage !== "undefined") {
              sessionStorage.setItem("adminPropertiesScrollToId", property.id);
            }
          }}
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={archiving}
          onClick={async () => {
            if (
              !confirm(
                "Send this villa to archive?\n\nIt will disappear from the catalog and main list. You can restore or permanently delete it from Archive."
              )
            ) {
              return;
            }
            await onArchive(property);
          }}
          className="w-full px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm text-center whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {archiving ? "Archiving..." : "To archive"}
        </button>
      </div>
    </div>
  );
}

const SCROLL_STORAGE_KEY = "adminPropertiesScrollToId";

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archivingIds, setArchivingIds] = useState<string[]>([]);
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollDoneRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchProperties = async () => {
    try {
      const response = await fetch(`/api/properties?_=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      const validProperties = (data.properties || []).filter((p: any) => p && p.id);
      setProperties(validProperties);
      setSelectedIds((prev) => prev.filter((id) => validProperties.some((p: Property) => p.id === id)));
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProperties();
  }, []);

  useEffect(() => {
    if (loading || properties.length === 0) return;
    const scrollToId =
      searchParams.get("scrollTo") ||
      (typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem(SCROLL_STORAGE_KEY)
        : null);
    if (!scrollToId || scrollDoneRef.current) return;
    scrollDoneRef.current = true;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(SCROLL_STORAGE_KEY);
    }
    const el = document.getElementById(`property-${scrollToId}`);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    if (searchParams.get("scrollTo")) {
      router.replace("/admin/properties", { scroll: false });
    }
  }, [loading, properties, searchParams, router]);

  const applyListsFromMutation = (payload: MutationListsPayload) => {
    if (Array.isArray(payload.properties)) {
      const nextProperties = payload.properties.filter((p) => p?.id);
      setProperties(nextProperties);
      setSelectedIds((prev) => prev.filter((id) => nextProperties.some((p) => p.id === id)));
      return;
    }
    void fetchProperties();
  };

  const toggleSelected = (propertyId: string) => {
    setSelectedIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleArchiveOne = async (property: Property) => {
    const previousProperties = properties;
    setArchivingIds((prev) => [...prev, property.id]);
    setProperties((prev) => prev.filter((p) => p.id !== property.id));
    setSelectedIds((prev) => prev.filter((id) => id !== property.id));

    try {
      const res = await fetch("/api/properties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action: "update",
          property: { ...property, archived: true },
        }),
      });
      const payload: MutationListsPayload = await res.json().catch(() => ({}));
      if (res.ok) {
        applyListsFromMutation(payload);
      } else {
        setProperties(previousProperties);
        alert(getPayloadError(payload));
      }
    } catch {
      setProperties(previousProperties);
      alert("Failed");
    } finally {
      setArchivingIds((prev) => prev.filter((id) => id !== property.id));
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0 || bulkArchiving) return;
    if (
      !confirm(
        `Send ${selectedIds.length} selected propert${selectedIds.length === 1 ? "y" : "ies"} to archive?\n\nThey will disappear from the main list and move to Archive.`
      )
    ) {
      return;
    }

    const previousProperties = properties;
    const idsToArchive = [...selectedIds];
    const idSet = new Set(idsToArchive);

    setBulkArchiving(true);
    setArchivingIds((prev) => [...new Set([...prev, ...idsToArchive])]);
    setProperties((prev) => prev.filter((p) => !idSet.has(p.id)));
    setSelectedIds([]);

    try {
      const res = await fetch("/api/properties", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          action: "bulkArchive",
          ids: idsToArchive,
        }),
      });
      const payload: MutationListsPayload = await res.json().catch(() => ({}));
      if (res.ok) {
        applyListsFromMutation(payload);
      } else {
        setProperties(previousProperties);
        setSelectedIds(idsToArchive);
        alert(getPayloadError(payload));
      }
    } catch {
      setProperties(previousProperties);
      setSelectedIds(idsToArchive);
      alert("Failed");
    } finally {
      setBulkArchiving(false);
      setArchivingIds((prev) => prev.filter((id) => !idSet.has(id)));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (bulkArchiving || archivingIds.length > 0) return;

    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = properties.findIndex((p) => p.id === active.id);
      const newIndex = properties.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const previousProperties = properties;
      const newProperties = arrayMove(properties, oldIndex, newIndex);
      setProperties(newProperties);

      try {
        const res = await fetch("/api/properties", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            action: "reorder",
            newOrder: newProperties.map((p) => p.id),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data.properties)) {
          setProperties(data.properties.filter((p: Property) => p?.id));
        } else if (!res.ok) {
          setProperties(previousProperties);
          alert(getPayloadError(data));
        }
      } catch (error) {
        console.error("Error updating order:", error);
        setProperties(previousProperties);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading properties...</div>;
  }

  const propertyIds = properties.map((p) => p.id).filter(Boolean);
  const selectedCount = selectedIds.length;
  const allSelected = properties.length > 0 && selectedCount === properties.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
        <Link
          href="/admin/properties/add"
          className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Add New Property
        </Link>
      </div>

      <p className="text-gray-600 mb-4">
        Drag properties to reorder them. Properties with lower order numbers appear first on the site.
      </p>

      {properties.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelectedIds(allSelected ? [] : properties.map((property) => property.id))
              }
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            Select all visible
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {selectedCount > 0 ? `${selectedCount} selected` : "Select properties to archive them together"}
            </span>
            <button
              type="button"
              onClick={handleBulkArchive}
              disabled={selectedCount === 0 || bulkArchiving}
              className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {bulkArchiving ? "Archiving..." : `Archive selected${selectedCount > 0 ? ` (${selectedCount})` : ""}`}
            </button>
          </div>
        </div>
      )}

      {properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No properties yet.</p>
          <Link href="/admin/properties/add" className="text-gray-900 underline">
            Add your first property
          </Link>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={propertyIds}
            strategy={verticalListSortingStrategy}
          >
            {properties.map((property) => (
              <SortablePropertyItem
                key={property.id}
                property={property}
                selected={selectedIds.includes(property.id)}
                archiving={archivingIds.includes(property.id)}
                onToggleSelected={toggleSelected}
                onArchive={handleArchiveOne}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
