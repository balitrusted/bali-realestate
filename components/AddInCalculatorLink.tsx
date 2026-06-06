"use client";

import { usePathname, useRouter } from "next/navigation";

type Props = {
  serviceId: string;
  className?: string;
};

export default function AddInCalculatorLink({ serviceId, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <button
      type="button"
      onClick={() => {
        router.push(`${pathname}?add=${encodeURIComponent(serviceId)}#calculator`, { scroll: false });
      }}
      className={
        className ??
        "mt-5 inline-flex text-sm font-semibold text-emerald-800 hover:text-emerald-950"
      }
    >
      Add in calculator →
    </button>
  );
}
