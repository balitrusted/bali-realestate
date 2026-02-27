import { redirect } from "next/navigation";
import { areas } from "@/types/areas";
import { PropertyType } from "@/types/property";

export const metadata = {
  title: "Property Catalog - Balitrusted",
  description: "Browse villas for rent and sale in Ubud, Canggu, and Sanur. Find your perfect long-term rental or investment property in Bali.",
};

const DEFAULT_TYPE: PropertyType = "rent";

export default function PropertiesPage() {
  const firstAreaId = Object.keys(areas)[0] as keyof typeof areas;
  redirect(`/properties/${DEFAULT_TYPE}/${firstAreaId}`);
}
