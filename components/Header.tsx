"use client";

import { useState } from "react";
import Link from "next/link";
import HeaderSavedLink from "@/components/HeaderSavedLink";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="inline-flex hover:opacity-80 transition-opacity">
            <div className="flex flex-col items-center">
              <span className="text-[1.625rem] font-bold text-gray-900">Balitrusted</span>
              <span className="text-[10px] text-gray-500 font-normal -mt-1">[ rent, buy, learn and explore ]</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/properties" className="text-gray-700 hover:text-gray-900">
              Properties
            </Link>
            <Link href="/guides" className="text-gray-700 hover:text-gray-900">
              Knowledge Base
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-gray-900">
              Blog
            </Link>
            <Link href="/qa" className="text-gray-700 hover:text-gray-900">
              Q&A
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900">
              About
            </Link>
            <HeaderSavedLink />
            <Link 
              href="/request" 
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Request
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-md"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            <Link href="/properties" className="py-3 text-gray-700 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              Properties
            </Link>
            <Link href="/guides" className="py-3 text-gray-700 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              Knowledge Base
            </Link>
            <Link href="/blog" className="py-3 text-gray-700 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              Blog
            </Link>
            <Link href="/qa" className="py-3 text-gray-700 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              Q&A
            </Link>
            <Link href="/about" className="py-3 text-gray-700 hover:text-gray-900" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
            <span className="py-3" onClick={() => setMobileMenuOpen(false)}>
              <HeaderSavedLink />
            </span>
            <Link
              href="/request"
              className="mt-2 inline-block px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Request
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
