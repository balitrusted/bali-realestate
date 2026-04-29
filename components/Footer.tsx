import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Balitrusted</h3>
            <p className="text-sm text-gray-600">
              Platform for long-term rentals and investments in Bali real estate.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Sections</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/properties"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Property Catalog
                </Link>
              </li>
              <li>
                <Link
                  href="/properties/map"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Property map
                </Link>
              </li>
              <li>
                <Link
                  href="/properties/archive"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Archived villas
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Knowledge Base
                </Link>
              </li>
              <li>
                <Link
                  href="/glossary"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Glossary
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/qa"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Q&A
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Information</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/about"
                  className="inline-block py-1.5 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  About
                </a>
              </li>
              <li>
                <Link
                  href="/guides/rent"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Long-term rental
                </Link>
              </li>
              <li>
                <Link
                  href="/guides/legal"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Legal and Safety
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/request"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Send Request
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="inline-block py-1 text-gray-600 hover:text-gray-900 touch-manipulation"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} Balitrusted. All rights reserved.
            {" · "}
            <Link href="/site-map" className="hover:text-gray-900 underline">
              Sitemap
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
