export const metadata = {
  title: "About",
  description: "Philosophy and approach of the Balitrusted project",
};

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            About This Project
          </h1>

          <div className="prose prose-lg max-w-none space-y-6">
            <p className="text-gray-700 leading-relaxed">
              This project was created to make Bali real estate more transparent, understandable, and accessible for people who plan to live, rent, or invest long term.
            </p>

            <p className="text-gray-700 leading-relaxed">
              Founded in January 2026, the platform builds on more than three years of hands-on experience in long-term property rentals in Bali. We are based in Ubud — a place we know deeply and genuinely appreciate — which is why a significant part of our curated real estate focuses on Ubud and its surrounding areas.
            </p>

            <p className="text-gray-700 leading-relaxed">
              Instead of aggressive sales and endless listings, we focus on clarity, verified information, and thoughtful decision-making. Our goal is not to push properties, but to help people understand the market, avoid common mistakes, and find options that truly fit their needs.
            </p>

            <p className="text-gray-700 leading-relaxed">
              We curate real estate in Bali — including villas for rent and sale, land, and business opportunities — with an emphasis on quality, long-term value, and realistic expectations. While Ubud remains our core area of expertise, we are gradually expanding to other regions across Bali.
            </p>

            <p className="text-gray-700 leading-relaxed">
              Beyond property listings, this platform serves as a growing knowledge base. We publish practical guides, legal insights, market analysis, and answers to real questions from people exploring Bali real estate. All content is based on real experience, research, and ongoing market observation.
            </p>

            <p className="text-gray-700 leading-relaxed">
              We believe that good real estate decisions come from understanding — not pressure. That's why this project combines a curated catalog, educational content, Q&A, and optional consultation to support clients through renting, buying, or investing in property in Bali.
            </p>

            <p className="text-gray-700 leading-relaxed">
              This is not just an agency. It is an evolving system designed to help people make smarter, safer, and more conscious real estate decisions over time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
