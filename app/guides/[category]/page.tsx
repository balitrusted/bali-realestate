import { notFound } from "next/navigation";
import Link from "next/link";
import { Article } from "@/types/article";
import { getArticles } from "@/lib/articlesData";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Static categories
const guideCategories = [
  {
    slug: "rent",
    title: "Long-term rental",
    description: "Everything about long-term villa rentals in Bali",
  },
  {
    slug: "buy",
    title: "Purchase and Investments",
    description: "Real information about buying real estate in Bali",
  },
  {
    slug: "land",
    title: "Land",
    description: "Risks and opportunities of land investments",
  },
  {
    slug: "legal",
    title: "Legal and Safety",
    description: "Legal aspects of rental and purchase",
  },
  {
    slug: "ubud",
    title: "Ubud",
    description: "Everything about Ubud: areas, neighborhoods, and local insights",
  },
  {
    slug: "areas",
    title: "Other Areas",
    description: "Reviews of other Bali areas",
  },
  {
    slug: "risks",
    title: "Mistakes and Reality",
    description: "Common mistakes and disappointments",
  }
];

async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    const articles = await getArticles();
    return articles.filter(a => a.category === category && a.published);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryInfo = guideCategories.find(c => c.slug === category);
  
  if (!categoryInfo) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${categoryInfo.title} - Knowledge Base`,
    description: categoryInfo.description,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryInfo = guideCategories.find(c => c.slug === category);
  
  if (!categoryInfo) {
    notFound();
  }

  const articles = await getArticlesByCategory(category);

  // Strip HTML tags from text
  function stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/guides" 
              className="text-gray-600 hover:text-gray-900 text-sm mb-4 inline-block"
            >
              ← Back to Knowledge Base
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {categoryInfo.title}
            </h1>
            <p className="text-xl text-gray-600">
              {categoryInfo.description}
            </p>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No articles in this category yet.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {articles.map((article) => {
                const preview = article.excerpt || (article.content ? stripHtml(article.content).substring(0, 200) + '...' : '');
                
                return (
                  <article key={article.id} className="border-b border-gray-200 pb-6">
                    <Link 
                      href={`/guides/${category}/${article.slug}`}
                      className="block hover:opacity-80 transition-opacity"
                    >
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2 hover:text-gray-700">
                        {article.title}
                      </h2>
                      {preview && (
                        <p className="text-gray-600 mb-3">
                          {preview}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {article.createdAt && (
                          <span>
                            {new Date(article.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </span>
                        )}
                        {article.views && article.views > 0 && (
                          <span>{article.views} views</span>
                        )}
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
