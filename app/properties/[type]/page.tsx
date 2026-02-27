import { notFound, redirect } from "next/navigation";
import { PropertyType } from "@/types/property";
import { areas } from "@/types/areas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const propertyTypeNames: Record<PropertyType, string> = {
  rent: "Rent",
  sale: "Buy",
  land: "Land",
  business: "Business",
};

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const propertyType = type as PropertyType;
  if (!propertyTypeNames[propertyType]) {
    return { title: "Properties Not Found" };
  }
  const verb = propertyType === "rent" ? "Rent" : "Buy";
  const noun = type === "rent" ? "Villas" : type === "sale" ? "Villas" : type === "land" ? "Land" : "Business";
  return {
    title: `${verb} ${noun} in Bali - Balitrusted`,
    description: `Browse ${propertyTypeNames[propertyType].toLowerCase()} in Bali. Find properties in Ubud, Canggu, and Sanur.`,
  };
}

export default async function PropertiesByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const propertyType = type as PropertyType;

  if (!propertyTypeNames[propertyType]) {
    notFound();
  }

  const firstAreaId = Object.keys(areas)[0] as keyof typeof areas;
  redirect(`/properties/${propertyType}/${firstAreaId}`);
}
