import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import ServicesCalculator from "@/components/ServicesCalculator";
import {
  CONCIERGE_ADDON,
  INSPECTION_CHECKLIST,
  SERVICE_BLOCKS,
  SERVICE_PACKAGES,
  SERVICES,
  SERVICES_DISCLAIMER,
} from "@/lib/servicesCatalog";

export const metadata = {
  title: "Services — Villa Checks, Relocation & Ubud Support | Balitrusted",
  description:
    "Fixed-fee Bali property services: remote villa checks, on-site inspections, shortlist hunts, relocation packages, and buying due diligence. Transparent pricing, Ubud expertise.",
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">Balitrusted Services</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Fixed-fee help for renting and relocating in Bali
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-stone-600 md:text-base">
            From a single remote villa check to full Ubud relocation — clear prices, no hidden landlord kickbacks. We
            coordinate trusted partners where specialists are needed; you always see the fee before you confirm.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="#calculator"
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Build your setup
            </a>
            <Link
              href="/properties/rent/ubud"
              className="rounded-lg border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-800 hover:border-emerald-300"
            >
              Browse Ubud rentals
            </Link>
          </div>
        </header>

        <div className="mx-auto mt-12 max-w-5xl">
          <ServicesCalculator />
        </div>

        {SERVICE_BLOCKS.map((block) => {
          if (block.id !== "relocation" && SERVICES.filter((s) => s.block === block.id).length === 0) {
            return null;
          }

          return (
            <section key={block.id} id={block.id} className="mx-auto mt-16 max-w-5xl scroll-mt-8">
              <h2 className="text-2xl font-semibold text-stone-900">{block.title}</h2>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">{block.subtitle}</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {block.id === "relocation"
                  ? SERVICE_PACKAGES.map((pkg) => (
                      <ServiceCard key={pkg.id} kind="package" item={pkg} />
                    ))
                  : SERVICES.filter((s) => s.block === block.id).map((s) => (
                      <ServiceCard key={s.id} kind="service" item={s} />
                    ))}
              </div>
              {block.id === "relocation" ? (
                <div className="mt-5">
                  <ServiceCard
                    kind="service"
                    item={CONCIERGE_ADDON}
                  />
                </div>
              ) : null}
            </section>
          );
        })}

        <section className="mx-auto mt-16 max-w-5xl rounded-3xl border border-stone-200 bg-stone-50/80 p-6 md:p-8">
          <h2 className="text-xl font-semibold text-stone-900">Our villa inspection checklist</h2>
          <p className="mt-2 text-sm text-stone-600">
            Every remote check and on-site visit uses the same practical lens — aligned with our{" "}
            <Link href="/guides/ubud" className="font-medium text-emerald-800 underline hover:text-emerald-950">
              Ubud area guides
            </Link>
            .
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {INSPECTION_CHECKLIST.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-stone-700">
                <span className="font-bold text-emerald-600" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-stone-500">
          <p>{SERVICES_DISCLAIMER}</p>
          <p className="mt-4">
            Questions before you book?{" "}
            <Link href="/request" className="font-medium text-emerald-800 underline hover:text-emerald-950">
              Send a request
            </Link>{" "}
            or email us via the contact on your confirmation — we reply in English.
          </p>
        </section>
      </div>
    </div>
  );
}
