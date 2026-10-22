import type { Property } from "@/types/property";

export function toPublicProperty(property: Property): Property {
  const publicProperty = { ...property };
  delete publicProperty.exactLocation;
  delete publicProperty.approximateLocationUrl;
  return publicProperty;
}
