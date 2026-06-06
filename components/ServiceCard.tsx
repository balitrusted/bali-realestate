import AddInCalculatorLink from "@/components/AddInCalculatorLink";
import type { ServiceItem, ServicePackage } from "@/lib/servicesCatalog";
import { formatServicePrice } from "@/lib/servicesCatalog";

type Props =
  | { kind: "service"; item: ServiceItem }
  | { kind: "package"; item: ServicePackage };

export default function ServiceCard({ item }: Props) {
  return (
    <article
      id={`service-${item.id}`}
      className="flex h-full scroll-mt-24 flex-col rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {item.popular ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            Popular
          </span>
        ) : null}
        {"partner" in item && item.partner ? (
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-medium text-stone-600">
            Partner coordinated
          </span>
        ) : null}
      </div>
      <h3 className="text-lg font-semibold text-stone-900">{item.name}</h3>
      <p className="mt-1 text-sm text-stone-600">{item.tagline}</p>
      <p className="mt-3 text-sm font-medium text-emerald-800">{formatServicePrice(item.priceUsd, item.priceIdr)}</p>
      <ul className="mt-4 flex-1 space-y-1.5 text-sm text-stone-600">
        {item.includes.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-emerald-600" aria-hidden>
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <AddInCalculatorLink serviceId={item.id} />
    </article>
  );
}
