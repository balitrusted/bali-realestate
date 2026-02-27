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
                <Link href="/properties" className="text-gray-600 hover:text-gray-900">
                  Property Catalog
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-gray-600 hover:text-gray-900">
                  Knowledge Base
                </Link>
              </li>
              <li>
                <Link href="/qa" className="text-gray-600 hover:text-gray-900">
                  Q&A
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Information</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900">
                  About
                </Link>
              </li>
              <li>
                <Link href="/guides/rent" className="text-gray-600 hover:text-gray-900">
                  Long-term rental
                </Link>
              </li>
              <li>
                <Link href="/guides/legal" className="text-gray-600 hover:text-gray-900">
                  Legal and Safety
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/request" className="text-gray-600 hover:text-gray-900">
                  Send Request
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="text-gray-600 hover:text-gray-900">
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
