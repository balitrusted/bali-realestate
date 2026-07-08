"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AdminNavLinkWithBadge } from "@/components/admin/AdminNavLinkWithBadge";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [badgeCounts, setBadgeCounts] = useState({
    commentsPending: 0,
    requestsNew: 0,
    notifyNew: 0,
    qaPending: 0,
  });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/admin/login") {
      setAuthenticated(true);
      return;
    }

    // Check authentication
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check");
        const text = await response.text();
        let data = { authenticated: false };
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            router.push("/admin/login");
            return;
          }
        }
        if (data.authenticated) {
          setAuthenticated(true);
        } else {
          router.push("/admin/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [pathname, router]);

  useEffect(() => {
    if (pathname === "/admin/login" || authenticated !== true) return;
    if (pathname === "/admin/qa/schedule" || pathname.startsWith("/admin/qa/schedule/")) {
      fetch("/api/admin/badge-seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "qa-schedule" }),
      })
        .then(() => window.dispatchEvent(new Event("admin-badges-refresh")))
        .catch(() => {});
    }
  }, [pathname, authenticated]);

  useEffect(() => {
    if (pathname === "/admin/login" || authenticated !== true) return;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/badge-counts", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setBadgeCounts({
          commentsPending: data.commentsPending ?? 0,
          requestsNew: data.requestsNew ?? 0,
          notifyNew: data.notifyNew ?? 0,
          qaPending: data.qaPending ?? 0,
        });
      } catch {
        /* ignore */
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    const onFocus = () => load();
    const onBadgesRefresh = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("admin-badges-refresh", onBadgesRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("admin-badges-refresh", onBadgesRefresh);
    };
  }, [pathname, authenticated]);

  // Show login page without layout
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect will happen
  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin/properties" className="text-xl font-semibold text-gray-900">
                Admin Panel
              </Link>
              <Link
                href="/admin/properties"
                className="text-gray-700 hover:text-gray-900"
              >
                Properties
              </Link>
              <Link
                href="/admin/properties/add"
                className="text-gray-700 hover:text-gray-900"
              >
                Add Property
              </Link>
              <Link
                href="/admin/articles"
                className="text-gray-700 hover:text-gray-900"
              >
                Articles
              </Link>
              <Link href="/admin/blog" className="text-gray-700 hover:text-gray-900">
                Blog
              </Link>
              <Link href="/admin/glossary" className="text-gray-700 hover:text-gray-900">
                Glossary
              </Link>
              <AdminNavLinkWithBadge href="/admin/qa" count={badgeCounts.qaPending}>
                Q&amp;A
              </AdminNavLinkWithBadge>
              <AdminNavLinkWithBadge href="/admin/comments" count={badgeCounts.commentsPending}>
                Comments
              </AdminNavLinkWithBadge>
              <Link
                href="/admin/properties/archive"
                className="text-gray-700 hover:text-gray-900"
              >
                Archive
              </Link>
              <AdminNavLinkWithBadge href="/admin/requests" count={badgeCounts.requestsNew}>
                Requests
              </AdminNavLinkWithBadge>
              <AdminNavLinkWithBadge href="/admin/notify-requests" count={badgeCounts.notifyNew}>
                Notify requests
              </AdminNavLinkWithBadge>
              <Link href="/admin/search-queries" className="text-gray-700 hover:text-gray-900">
                Search history
              </Link>
              <Link
                href="/admin/catalog-structure"
                className="text-gray-700 hover:text-gray-900"
              >
                Catalog structure
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/properties"
                target="_blank"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                View Site
              </Link>
              <button
                onClick={async () => {
                  // Clear cookie
                  document.cookie = "admin-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  // Also call logout API if needed
                  await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
                  router.push("/admin/login");
                  router.refresh();
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main lang="en" className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
