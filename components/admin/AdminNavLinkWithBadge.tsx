"use client";

import Link from "next/link";

export function AdminNavLinkWithBadge({
  href,
  children,
  count,
}: {
  href: string;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-900"
    >
      <span>{children}</span>
      {count > 0 ? (
        <span
          className="inline-flex min-h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white tabular-nums shadow-sm"
          aria-label={`${count} new`}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
