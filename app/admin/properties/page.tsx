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
import Image from "next/image";
import { getPropertyDisplayTitle, fixDescriptionDisplay } from "@/lib/propertyUtils";
import { subAreaNames, SUBAREA_UNSPECIFIED_LABEL } from "@/types/areas";

function SortablePropertyItem({ property }: { property: Property }) {
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
    opacity: isDragging ? 0.5 : 1,
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === "IDR") {
      return `${(price / 1000000).toFixed(0)}M IDR`;
    }
    return `$${price.toLocaleString()}`;
  };

  const mainImage = property.images && property.images.length > 0 
    ? property.images[0] 
    : null;

  // Safe access to price
  const price = property.price || { min: 0, currency: "IDR" as const };
  const forSale = property.types?.includes("sale") && price.forSale != null && price.forSale > 0;
  const hasRentPrice = (price.min != null && price.min > 0) || price.monthly != null || price.yearly != null;
  const priceDisplay = forSale
    ? formatPrice(price.forSale!, price.currency || "IDR") + " (sale)"
    : hasRentPrice
      ? price.yearly != null && price.yearly > 0
        ? formatPrice(price.yearly, price.currency || "IDR") + " / year"
        : formatPrice(price.monthly ?? price.min ?? 0, price.currency || "IDR") + (price.monthly != null ? " / month" : "")
      : "Price not set";

  return (
    <div
      ref={setNodeRef}
      id={`property-${property.id}`}
      style={style}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center gap-4"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {mainImage ? (
        <div className="w-24 h-24 relative rounded overflow-hidden flex-shrink-0">
          <Image
            src={mainImage}
            alt={getPropertyDisplayTitle(property)}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
      ) : (
        <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-gray-400">No image</span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">
          {property.internalName?.trim() || getPropertyDisplayTitle(property)}
        </h3>
        {property.internalName?.trim() && (
          <p className="text-xs text-gray-500 truncate">{getPropertyDisplayTitle(property)}</p>
        )}
        <p className="text-sm text-gray-600 truncate">{fixDescriptionDisplay(property.description) || "No description"}</p>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 flex-wrap">
          <span>{property.bedrooms || 0} bedrooms</span>
          <span>{property.subArea ? (subAreaNames[property.subArea] || property.subArea) : SUBAREA_UNSPECIFIED_LABEL}</span>
          {property.types && property.types.length > 0 && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {property.types.join(', ')}
            </span>
          )}
          <span className="font-semibold text-gray-900">
            {priceDisplay}
          </span>
          <span className="text-xs">
            Availability: {property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : "Now"}
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
          onClick={async () => {
            if (!confirm("Send this villa to archive?\n\nIt will disappear from the catalog and main list. You can restore it later from the Archive.")) return;
            try {
              const res = await fetch("/api/properties", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update", property: { ...property, archived: true } }),
              });
              if (res.ok) window.location.reload();
              else alert("Failed");
            } catch (e) {
              alert("Failed");
            }
          }}
          className="w-full px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm text-center whitespace-nowrap"
        >
          To archive
        </button>
        <button
          onClick={async () => {
            if (!confirm("Delete this property permanently?\n\nThis cannot be undone. The villa will be removed from the site.")) return;
            try {
              await fetch(`/api/properties?id=${property.id}`, {
                method: "DELETE",
              });
              window.location.reload();
            } catch (e) {
              alert("Failed to delete");
            }
          }}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm text-center whitespace-nowrap"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

const SCROLL_STORAGE_KEY = "adminPropertiesScrollToId";

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const scrollDoneRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProperties();
  }, []);

  // After list is rendered, scroll to the property we returned from (back button or after save)
  useEffect(() => {
    if (loading || properties.length === 0) return;
    const scrollToId =
      searchParams.get("scrollTo") ||
      (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(SCROLL_STORAGE_KEY) : null);
    if (!scrollToId || scrollDoneRef.current) return;
    scrollDoneRef.current = true;
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(SCROLL_STORAGE_KEY);
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

  const fetchProperties = async () => {
    try {
      const response = await fetch("/api/properties");
      const data = await response.json();
      
      // Validate and filter properties
      const validProperties = (data.properties || []).filter((p: any) => {
        return p && p.id;
      });
      
      setProperties(validProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = properties.findIndex((p) => p.id === active.id);
      const newIndex = properties.findIndex((p) => p.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newProperties = arrayMove(properties, oldIndex, newIndex);
      setProperties(newProperties);

      // Update order in backend
      const newOrder = newProperties.map((p) => p.id);
      try {
        await fetch("/api/properties", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reorder",
            newOrder,
          }),
        });
      } catch (error) {
        console.error("Error updating order:", error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">Loading properties...</div>;
  }

  const propertyIds = properties.map((p) => p.id).filter(Boolean);

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

      <p className="text-gray-600 mb-6">
        Drag properties to reorder them. Properties with lower order numbers appear first on the site.
      </p>

      {properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No properties yet.</p>
          <Link
            href="/admin/properties/add"
            className="text-gray-900 underline"
          >
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
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
