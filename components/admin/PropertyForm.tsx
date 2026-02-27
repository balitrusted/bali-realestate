"use client";

import { useState, useEffect } from "react";
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
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { Property, MainArea, SubArea, PropertyType } from "@/types/property";
import { areas, subAreaNames, SUBAREA_UNSPECIFIED_LABEL, isSubAreaOfMainArea } from "@/types/areas";
import { fixVillaNumberDisplay, fixDescriptionDisplay } from "@/lib/propertyUtils";

interface PropertyFormProps {
  property?: Property;
  onSave: (property: any) => void;
}

function SortableImageItem({ url, onDelete }: { url: string; onDelete: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: url });

  const [imageError, setImageError] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Check if URL is local (starts with /uploads) or external
  const isLocal = url.startsWith('/uploads');
  
  // Debug: log the URL
  useEffect(() => {
    if (isLocal) {
      console.log('Loading local image:', url);
    }
  }, [url, isLocal]);

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, backgroundColor: '#f3f4f6' }}
      className="relative group w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200"
    >
      {!imageError ? (
        <>
          {isLocal ? (
            // For local images, use regular img tag
            <img
              src={url}
              alt="Property"
              className="w-full h-full object-cover"
              style={{ 
                display: 'block',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 1
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.error('❌ Image load error for:', url);
                console.error('Failed src:', target?.src);
                setImageError(true);
              }}
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                console.log('✅ Image loaded successfully:', url);
                console.log('Image dimensions:', target.naturalWidth, 'x', target.naturalHeight);
                console.log('Image computed style:', window.getComputedStyle(target).display);
                console.log('Image opacity:', window.getComputedStyle(target).opacity);
                console.log('Image visibility:', window.getComputedStyle(target).visibility);
                setImageError(false);
              }}
            />
          ) : (
            // For external images, use Next.js Image
            <Image
              src={url}
              alt="Property"
              fill
              className="object-cover"
              sizes="128px"
              style={{ zIndex: 1 }}
              onError={() => setImageError(true)}
            />
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <span className="text-xs text-gray-500 text-center px-2">Failed to load</span>
        </div>
      )}
      {/* Drag handle - visible on hover */}
      <div 
        className="absolute top-0 left-0 p-1 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity rounded-br-lg"
        style={{ zIndex: 10 }}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-white p-1"
          title="Drag to reorder"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>
      
      {/* Delete button - visible on hover */}
      <div 
        className="absolute top-0 right-0 p-1 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity rounded-bl-lg"
        style={{ zIndex: 10 }}
      >
        <button
          onClick={onDelete}
          className="text-white p-1 hover:text-red-400"
          title="Delete image"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function PropertyForm({ property, onSave }: PropertyFormProps) {
  const [formData, setFormData] = useState({
    title: property?.title ?? "",
    villaNumber: fixVillaNumberDisplay(property?.villaNumber) ?? "",
    internalName: property?.internalName ?? "",
    description: fixDescriptionDisplay(property?.description) || "",
    types: property?.types || ["rent"] as PropertyType[],
    mainArea: property?.mainArea || "ubud" as MainArea,
    subArea: (property?.mainArea && property?.subArea && isSubAreaOfMainArea(property.mainArea, property.subArea))
      ? property.subArea
      : (areas[property?.mainArea || "ubud"]?.subAreas?.[0] as SubArea | undefined),
    exactLocation: property?.exactLocation ?? "",
    displayLocation: property?.displayLocation ?? "",
    bedrooms: property?.bedrooms || 1,
    bathrooms: property?.bathrooms || 1,
    priceMin: property?.price.min || 0,
    priceMonthly: property?.price.monthly ?? property?.price.min ?? undefined,
    priceYearly: property?.price.yearly ?? undefined,
    priceForSale: property?.price.forSale ?? undefined,
    priceCurrency: property?.price.currency || "IDR",
    durationMin: property?.duration?.min || 1,
    durationMax: property?.duration?.max || undefined,
    features: {
      bathtub: property?.features.bathtub || false,
      carPark: property?.features.carPark || false,
      closedKitchen: property?.features.closedKitchen || false,
      desk: property?.features.desk || false,
      enclosedLivingArea: property?.features.enclosedLivingArea || false,
      garage: property?.features.garage || false,
      highSpeedWifi: property?.features.highSpeedWifi || false,
      natureView: property?.features.natureView || false,
      petFriendly: property?.features.petFriendly || false,
      pool: property?.features.pool || false,
      washingMachine: property?.features.washingMachine || false,
    },
    images: property?.images || [] as string[],
    archived: property?.archived ?? false,
    availableFrom: property?.availableFrom ?? null,
  });

  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const propertyData = {
      ...formData,
      title: formData.title.trim() || undefined,
      villaNumber: formData.villaNumber.trim() || undefined,
      internalName: formData.internalName.trim() || undefined,
      types: formData.types,
      mainArea: formData.mainArea,
      subArea: formData.subArea ?? null,
      exactLocation: formData.exactLocation.trim() || undefined,
      displayLocation: formData.displayLocation.trim() || undefined,
      price: {
        currency: formData.priceCurrency,
        min: formData.priceMonthly ?? formData.priceMin ?? 0,
        monthly: formData.priceMonthly || undefined,
        yearly: formData.priceYearly || undefined,
        forSale: formData.priceForSale || undefined,
      },
      duration: {
        min: formData.durationMin,
        max: formData.durationMax || undefined,
      },
      order: property?.order ?? 999,
      archived: formData.archived,
      availableFrom: formData.availableFrom || null,
    };

    onSave(propertyData);
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()],
      });
      setNewImageUrl("");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invalidFiles = files.filter(
      (file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024
    );
    if (invalidFiles.length > 0) {
      alert(
        "Some files are invalid. Please select only image files under 10MB each."
      );
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // Upload one by one so each gets correct SEO filename index (villa-2beds-33-ubud-kemenuh-1, -2, ...)
      for (let i = 0; i < files.length; i++) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", files[i]);
        uploadFormData.set("imageIndex", String(formData.images.length + i));
        uploadFormData.set("villaNumber", formData.villaNumber || "");
        uploadFormData.set("bedrooms", String(formData.bedrooms ?? 1));
        uploadFormData.set("mainArea", formData.mainArea || "ubud");
        if (formData.subArea) uploadFormData.set("subArea", formData.subArea);
        uploadFormData.set("types", JSON.stringify(formData.types));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Upload failed");
        }
        const data = await response.json();
        uploadedUrls.push(data.url);
      }

      setFormData({
        ...formData,
        images: [...formData.images, ...uploadedUrls],
      });
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload images");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = formData.images.findIndex((url) => url === active.id);
      const newIndex = formData.images.findIndex((url) => url === over.id);

      setFormData({
        ...formData,
        images: arrayMove(formData.images, oldIndex, newIndex),
      });
    }
  };


  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Villa number *
          </label>
          <input
            type="text"
            required
            value={formData.villaNumber}
            onChange={(e) => setFormData({ ...formData, villaNumber: e.target.value })}
            placeholder="e.g. 50"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">Used in auto-title, e.g. Villa #50 · 2 bed · Lodtunduh</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Leave empty to auto-generate from villa number and parameters"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Internal name (only in admin)
          </label>
          <input
            type="text"
            value={formData.internalName}
            onChange={(e) => setFormData({ ...formData, internalName: e.target.value })}
            placeholder="e.g. Sunset Villa — not shown on the site"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">For your reference in the admin panel only. Visitors never see this.</p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <input
            type="checkbox"
            id="archived"
            checked={formData.archived}
            onChange={(e) => setFormData({ ...formData, archived: e.target.checked })}
            className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
          />
          <label htmlFor="archived" className="text-sm font-medium text-gray-900">
            Archived (not available)
          </label>
          <p className="text-xs text-gray-500 ml-1">Villa is hidden from catalog and main list. Direct link still works; page shows &quot;Not available&quot; and &quot;Notify when available&quot; form.</p>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <span className="block text-sm font-medium text-gray-900">Availability</span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="availability"
                checked={formData.availableFrom == null || formData.availableFrom === ""}
                onChange={() => setFormData({ ...formData, availableFrom: null })}
                className="border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <span className="text-sm text-gray-700">Now</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="availability"
                checked={formData.availableFrom != null && formData.availableFrom !== ""}
                onChange={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setFormData({ ...formData, availableFrom: formData.availableFrom || today });
                }}
                className="border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <span className="text-sm text-gray-700">From date</span>
            </label>
            {formData.availableFrom != null && formData.availableFrom !== "" && (
              <>
                <input
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value || null })}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-gray-500 focus:border-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, availableFrom: new Date().toISOString().slice(0, 10) })}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Set to today
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-gray-500">When &quot;Now&quot;, villa is available. When &quot;From date&quot;, you can set when it becomes available.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Description (optional)
          </label>
          <textarea
            rows={6}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          />
        </div>

        {/* Property Types - Multiple selection */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Property Types * (can select multiple - e.g., both Rent and Sale)
          </label>
          <div className="space-y-2">
            {[
              { value: 'rent', label: 'Villas for Rent' },
              { value: 'sale', label: 'Villas for Sale' },
              { value: 'land', label: 'Land' },
              { value: 'business', label: 'Business' },
            ].map(type => (
              <label key={type.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.types.includes(type.value as PropertyType)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        types: [...formData.types, type.value as PropertyType],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        types: formData.types.filter(t => t !== type.value),
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span className="ml-2 text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Main Area *
            </label>
            <select
              value={formData.mainArea}
              onChange={(e) => {
                const newMainArea = e.target.value as MainArea;
                const areaInfo = areas[newMainArea];
                const validSub = areaInfo?.subAreas?.length
                  ? (isSubAreaOfMainArea(newMainArea, formData.subArea as SubArea) ? formData.subArea : areaInfo.subAreas[0])
                  : undefined;
                setFormData({
                  ...formData,
                  mainArea: newMainArea,
                  subArea: validSub as SubArea | undefined,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            >
              {Object.values(areas).map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Neighborhood (Sub-Area)
            </label>
            <select
              value={formData.subArea ?? ""}
              onChange={(e) => setFormData({ ...formData, subArea: (e.target.value || undefined) as SubArea | undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            >
              {areas[formData.mainArea]?.subAreas ? (
                areas[formData.mainArea].subAreas!.map((subArea) => (
                  <option key={subArea} value={subArea}>
                    {subAreaNames[subArea]}
                  </option>
                ))
              ) : (
                <option value="">{SUBAREA_UNSPECIFIED_LABEL}</option>
              )}
            </select>
            <p className="text-xs text-gray-500 mt-1">Only Ubud has sub-areas. Other areas show &quot;{SUBAREA_UNSPECIFIED_LABEL}&quot;.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Exact location (admin only)
          </label>
          <input
            type="url"
            value={formData.exactLocation}
            onChange={(e) => setFormData({ ...formData, exactLocation: e.target.value })}
            placeholder="e.g. Google Maps link"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">Link for your reference only. Not shown on the site.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Display location (for map)
          </label>
          <input
            type="text"
            value={formData.displayLocation}
            onChange={(e) => setFormData({ ...formData, displayLocation: e.target.value })}
            placeholder="e.g. -8.5068,115.2624 (latitude,longitude)"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">Coordinates for map. Leave empty if not set yet.</p>
        </div>
      </div>

      {/* Property Details */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Property Details</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Bedrooms *
            </label>
            <select
              value={formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Bathrooms
            </label>
            <input
              type="number"
              min="1"
              value={formData.bathrooms}
              onChange={(e) => setFormData({ ...formData, bathrooms: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Price</h2>
        <p className="text-sm text-gray-600">
          For rent: set monthly and optionally yearly (site will show discount %). For sale: use monthly or min as full price.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Price (monthly) *
            </label>
            <input
              type="number"
              min="0"
              value={formData.priceMonthly ?? formData.priceMin ?? ""}
              onChange={(e) => {
                const v = e.target.value ? parseInt(e.target.value) : undefined;
                setFormData({ ...formData, priceMonthly: v, priceMin: v ?? 0 });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Price (yearly)
            </label>
            <input
              type="number"
              min="0"
              value={formData.priceYearly ?? ""}
              onChange={(e) => setFormData({ ...formData, priceYearly: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              placeholder="Optional – shows discount %"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Price (for sale)
            </label>
            <input
              type="number"
              min="0"
              value={formData.priceForSale ?? ""}
              onChange={(e) => setFormData({ ...formData, priceForSale: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
              placeholder="For objects on sale"
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Currency *
            </label>
            <select
              value={formData.priceCurrency}
              onChange={(e) => setFormData({ ...formData, priceCurrency: e.target.value as "IDR" | "USD" })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            >
              <option value="IDR">IDR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Rental Duration</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Min Duration (months) *
            </label>
            <input
              type="number"
              required
              min="1"
              value={formData.durationMin}
              onChange={(e) => setFormData({ ...formData, durationMin: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Max Duration (months)
            </label>
            <input
              type="number"
              min="1"
              value={formData.durationMax || ""}
              onChange={(e) => setFormData({ ...formData, durationMax: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Features</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { key: "bathtub", label: "Bathtub" },
            { key: "carPark", label: "Car park" },
            { key: "closedKitchen", label: "Closed kitchen" },
            { key: "desk", label: "Desk" },
            { key: "enclosedLivingArea", label: "Enclosed living area" },
            { key: "garage", label: "Garage" },
            { key: "highSpeedWifi", label: "High-speed WiFi" },
            { key: "natureView", label: "Nature view" },
            { key: "petFriendly", label: "Pet friendly" },
            { key: "pool", label: "Pool" },
            { key: "washingMachine", label: "Washing machine" },
          ].map((feature) => (
            <label key={feature.key} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.features[feature.key as keyof typeof formData.features]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    features: {
                      ...formData.features,
                      [feature.key]: e.target.checked,
                    },
                  })
                }
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <span className="ml-2 text-sm text-gray-700">{feature.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Images</h2>
        <p className="text-sm text-gray-600">
          Drag images to reorder them. The first image will be the main image shown on the property card.
        </p>
        
        <div className="space-y-3">
          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload Images from Computer (you can select multiple)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800 file:cursor-pointer disabled:opacity-50"
            />
            {uploading && (
              <p className="mt-2 text-sm text-gray-600">Uploading images...</p>
            )}
          </div>

          {/* URL input (for external images) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Or paste image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Paste image URL here (e.g., from Cloudinary, ImgBB, etc.)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={!newImageUrl.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add URL
              </button>
            </div>
          </div>
        </div>

        {formData.images.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleImageDragEnd}
          >
            <SortableContext
              items={formData.images}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap gap-4">
                {formData.images.map((url, index) => (
                  <SortableImageItem
                    key={url}
                    url={url}
                    onDelete={() => handleDeleteImage(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <button
          type="submit"
          className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
        >
          Save Property
        </button>
      </div>
    </form>
  );
}
