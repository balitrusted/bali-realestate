import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/" className="inline-flex hover:opacity-80 transition-opacity">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-gray-900">Balitrusted</span>
              <span className="text-[10px] text-gray-500 font-normal mt-0.5">[ rent, buy, learn, explore ]</span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/properties" className="text-gray-700 hover:text-gray-900">
              Properties
            </Link>
            <Link href="/guides" className="text-gray-700 hover:text-gray-900">
              Knowledge Base
            </Link>
            <Link href="/qa" className="text-gray-700 hover:text-gray-900">
              Q&A
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-gray-900">
              About
            </Link>
            <Link 
              href="/request" 
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Request
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
      </div>
    </header>
  );
}
