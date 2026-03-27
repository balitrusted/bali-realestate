"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSaved } from "@/components/SavedProvider";
import PropertyCard from "@/components/PropertyCard";
import PriceText from "@/components/PriceText";
import type { Property } from "@/types/property";
import { areas } from "@/types/areas";
import { MAX_COMPARE } from "@/lib/savedStore";

type ListedProperty = Property & { publicSlug: string };

export default function SavedPage() {
  const { favorites, compare, removeFromCompare, refresh } = useSaved();

  const [favoriteProps, setFavoriteProps] = useState<ListedProperty[]>([]);
  const [compareProps, setCompareProps] = useState<ListedProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const allIds = [...new Set([...favorites, ...compare])];

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (allIds.length === 0) {
      setFavoriteProps([]);
      setCompareProps([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/properties?ids=${allIds.join(",")}`)
      .then((res) => res.json())
      .then((data: { properties?: ListedProperty[] }) => {
        const list = (data.properties ?? []).filter((p): p is ListedProperty => Boolean(p.publicSlug));
        const favSet = new Set(favorites);
        const compSet = new Set(compare);
        setFavoriteProps(list.filter((p) => p.id && favSet.has(p.id)));
        setCompareProps(list.filter((p) => p.id && compSet.has(p.id)));
      })
      .catch(() => {
        setFavoriteProps([]);
        setCompareProps([]);
      })
      .finally(() => setLoading(false));
  }, [favorites.join(","), compare.join(",")]);

  const requestIds = [...favorites, ...compare].filter((id, i, arr) => arr.indexOf(id) === i);

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved</h1>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : favorites.length === 0 && compare.length === 0 ? (
          <div className="max-w-md">
            <p className="text-gray-600 mb-4">
              You haven’t saved any properties yet. Use the heart to add favorites and the compare button on property cards to build your list.
            </p>
            <Link href="/properties" className="text-gray-900 font-medium underline">
              Browse properties
            </Link>
          </div>
        ) : (
          <>
            {/* Favorites */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Favorites {favorites.length > 0 && `(${favorites.length})`}
              </h2>
              {favoriteProps.length === 0 ? (
                <p className="text-gray-500 text-sm">No favorites yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteProps.map((p) => (
                    <PropertyCard key={p.id} property={p} detailSlug={p.publicSlug} />
                  ))}
                </div>
              )}
            </section>

            {/* Compare */}
            <section className="mb-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Compare {compare.length > 0 && `(${compare.length}/${MAX_COMPARE})`}
              </h2>
              {compareProps.length < 2 ? (
                <p className="text-gray-500 text-sm">
                  Add at least 2 properties from the catalog to compare them side by side.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full min-w-[600px] border border-gray-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b border-gray-200 w-32">
                           
                          </th>
                          {compareProps.map((p) => (
                            <th key={p.id} className="text-left py-3 px-4 text-sm font-semibold text-gray-900 border-b border-gray-200 align-top">
                              <div className="flex justify-between items-start gap-2">
                                <Link
                                  href={`/properties/${p.publicSlug ?? p.id}`}
                                  className="underline hover:no-underline line-clamp-2"
                                >
                                  {p.title?.trim() || `Villa #${p.villaNumber ?? p.id} · ${p.bedrooms} bed`}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => removeFromCompare(p.id)}
                                  className="text-gray-400 hover:text-red-600 shrink-0"
                                  title="Remove from compare"
                                >
                                  ×
                                </button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-4 text-gray-500 bg-gray-50">Area</td>
                          {compareProps.map((p) => (
                            <td key={p.id} className="py-2 px-4">{areas[p.mainArea]?.nameEn ?? p.mainArea}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-4 text-gray-500 bg-gray-50">Bedrooms</td>
                          {compareProps.map((p) => (
                            <td key={p.id} className="py-2 px-4">{p.bedrooms}</td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-4 text-gray-500 bg-gray-50">Price</td>
                          {compareProps.map((p) => (
                            <td key={p.id} className="py-2 px-4">
                              {p.types?.includes("sale") && p.price.forSale != null ? (
                                <PriceText amount={p.price.forSale} sourceCurrency={p.price.currency} />
                              ) : (p.price.monthly ?? p.price.min) != null && (p.price.monthly ?? p.price.min)! > 0 ? (
                                <>
                                  <PriceText amount={p.price.monthly ?? p.price.min ?? 0} sourceCurrency={p.price.currency} />
                                  /mo
                                </>
                              ) : p.price.yearly != null && p.price.yearly > 0 ? (
                                <>
                                  <PriceText amount={p.price.yearly} sourceCurrency={p.price.currency} />
                                  /yr
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 px-4 text-gray-500 bg-gray-50">Features</td>
                          {compareProps.map((p) => (
                            <td key={p.id} className="py-2 px-4">
                              {[
                                p.features.pool && "Pool",
                                p.features.bathtub && "Bathtub",
                                p.features.natureView && "Nature view",
                                p.features.closedKitchen && "Closed kitchen",
                                p.features.petFriendly && "Pet friendly",
              p.features.desk && "Desk",
              p.features.carPark && "Car park",
                              ]
                                .filter(Boolean)
                                .join(", ") || "—"}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {/* CTA */}
            {requestIds.length > 0 && (
              <section className="border-t border-gray-200 pt-8">
                <p className="text-gray-600 mb-4">
                  Want to ask about these properties or request a viewing?
                </p>
                <Link
                  href={`/request?ids=${requestIds.join(",")}`}
                  className="inline-block px-5 py-2.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
                >
                  Send request
                </Link>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
