"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
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
        const data = await response.json();
        
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
              <Link
                href="/admin/comments"
                className="text-gray-700 hover:text-gray-900"
              >
                Comments
              </Link>
              <Link
                href="/admin/properties/archive"
                className="text-gray-700 hover:text-gray-900"
              >
                Archive
              </Link>
              <Link
                href="/admin/notify-requests"
                className="text-gray-700 hover:text-gray-900"
              >
                Notify requests
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
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
