import Link from "next/link";
import { Article } from "@/types/article";
import { readFile } from "fs/promises";
import { join } from "path";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Static categories with their articles
const guideCategories = [
  {
    slug: "rent",
    title: "Long-term rental",
    description: "Everything about long-term villa rentals in Bali",
    articles: [
      {
        slug: "long-stay-rental-bali",
        title: "Long-term Villa Rental in Bali: From 6 Months and More",
        preview: "Why monthly rental is the worst option for living in Bali..."
      },
      {
        slug: "monthly-rental-worst-option",
        title: "Why Monthly Rental is the Worst Option for Living in Bali",
        preview: "Short-term rental creates many problems..."
      },
      {
        slug: "family-villa-ubud",
        title: "Renting a Villa for Family in Ubud: What to Look For",
        preview: "When choosing a villa for family, it's important to consider..."
      }
    ]
  },
  {
    slug: "buy",
    title: "Purchase and Investments",
    description: "Real information about buying real estate in Bali",
    articles: [
      {
        slug: "buying-villa-bali",
        title: "Buying a Villa in Bali: What You Actually Buy",
        preview: "Most foreigners cannot buy land..."
      },
      {
        slug: "leasehold-vs-freehold",
        title: "Leasehold vs Freehold in Simple Terms",
        preview: "The difference between these ownership types is critical..."
      }
    ]
  },
  {
    slug: "land",
    title: "Land",
    description: "Risks and opportunities of land investments",
    articles: [
      {
        slug: "land-investment-risks",
        title: "Land in Bali: Main Risks",
        preview: "Buying land in Bali comes with serious risks..."
      }
    ]
  },
  {
    slug: "legal",
    title: "Legal and Safety",
    description: "Legal aspects of rental and purchase",
    articles: [
      {
        slug: "rental-contract-bali",
        title: "What a Normal Rental Contract in Bali Looks Like",
        preview: "A rental contract should contain the following points..."
      },
      {
        slug: "check-before-signing",
        title: "What to Check Before Signing a Contract",
        preview: "Before signing a contract, be sure to check..."
      }
    ]
  },
  {
    slug: "ubud",
    title: "Ubud",
    description: "Everything about Ubud: areas, neighborhoods, and local insights",
    articles: [
      // Articles will be loaded dynamically from data/articles.ts
    ]
  },
  {
    slug: "areas",
    title: "Areas",
    description: "Reviews of other Bali areas",
    articles: [
      {
        slug: "quiet-areas-ubud-family",
        title: "Quiet Areas of Ubud for Family Living",
        preview: "Not all areas of Ubud are suitable for long-term living..."
      },
      {
        slug: "ubud-center-bad-idea",
        title: "Why Ubud Center is a Bad Idea for Long-term",
        preview: "Ubud center is overloaded with tourists and noise..."
      }
    ]
  },
  {
    slug: "risks",
    title: "Mistakes and Reality",
    description: "Common mistakes and disappointments",
    articles: [
      {
        slug: "disappointments-bali-rental",
        title: "Why 80% of People Get Disappointed with Bali Rentals",
        preview: "Main reasons for disappointment are related to..."
      },
      {
        slug: "myths-bali-realestate",
        title: "Myths About Bali Real Estate Market",
        preview: "Common misconceptions about real estate in Bali..."
      }
    ]
  }
];

export const metadata = {
  title: "Knowledge Base",
  description: "Practical articles about rentals, purchases, legal aspects, and areas of Bali",
};

// Strip HTML tags from text
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .trim();
}

// Calculate reading time (average reading speed: 200 words per minute)
function calculateReadingTime(content: string): number {
  const text = stripHtml(content);
  const words = text.split(/\s+/).filter(word => word.length > 0).length;
  const minutes = Math.ceil(words / 200);
  return minutes || 1; // Minimum 1 minute
}

// Get comment count for an article
async function getCommentCount(articleId: string): Promise<number> {
  try {
    const { comments } = await import("@/data/comments");
    const articleComments = comments.filter(c => c.articleId === articleId && c.approved);
    return articleComments.length;
  } catch {
    return 0;
  }
}

async function getArticlesByCategory(category: string): Promise<Article[]> {
  try {
    // Read articles directly from file
    const filePath = join(process.cwd(), 'data', 'articles.ts');
    const fileContent = await readFile(filePath, 'utf-8');
    const { articles } = await import("@/data/articles");
    
    return articles.filter(a => a.category === category && a.published);
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
}

export default async function GuidesPage() {
  // Fetch all articles dynamically for each category
  const categorySlugs = guideCategories.map(cat => cat.slug);
  
  // Fetch articles for all categories that might have dynamic articles
  const articlesByCategory = new Map<string, Article[]>();
  for (const slug of categorySlugs) {
    const articles = await getArticlesByCategory(slug);
    if (articles.length > 0) {
      articlesByCategory.set(slug, articles);
    }
  }
  
  // Update categories with fetched articles, or use fallback static articles
  const categoriesWithArticles = await Promise.all(guideCategories.map(async (category) => {
    const dynamicArticles = articlesByCategory.get(category.slug);
    
    // If we have dynamic articles, use them; otherwise use static fallback
    const articlesToUse = dynamicArticles || category.articles;
    
    return {
      ...category,
      articles: await Promise.all(articlesToUse.map(async (article: any) => {
        // If it's already in the format { slug, title, preview }, enrich it with metadata if possible
        if (article.slug && article.title && article.preview && !article.id) {
          // Static article - return as is
          return article;
        }
        
        // Otherwise, it's an Article object from the database
        let preview = article.excerpt || '';
        if (!preview && article.content) {
          preview = stripHtml(article.content).substring(0, 150);
          if (article.content.length > 150) {
            preview += '...';
          }
        }

        // Get comment count
        const commentCount = await getCommentCount(article.id);
        
        // Calculate reading time
        const readingTime = calculateReadingTime(article.content);

        return {
          id: article.id,
          slug: article.slug,
          title: article.title,
          preview: preview,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          views: article.views || 0,
          commentCount: commentCount,
          readingTime: readingTime,
        };
      }))
    };
  }));

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Knowledge Base
          </h1>
          <p className="text-xl text-gray-600">
            Practical articles based on real experience and market research. 
            No marketing, only facts and useful information.
          </p>
        </div>

        <div className="space-y-12">
          {categoriesWithArticles.map((category) => (
            <section key={category.slug}>
              <div className="mb-6">
                <Link
                  href={`/guides/${category.slug}`}
                  className="text-2xl font-semibold text-gray-900 hover:text-gray-700"
                >
                  {category.title}
                </Link>
                <p className="text-gray-600 mt-2">{category.description}</p>
              </div>

              {category.articles.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {category.articles.map((article: any) => (
                    <Link
                      key={article.slug}
                      href={`/guides/${category.slug}/${article.slug}`}
                      className="block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">{article.preview}</p>
                      
                      {/* Metadata bar */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-200">
                        <span>{new Date(article.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        
                        {article.readingTime && (
                          <>
                            <span>•</span>
                            <span>{article.readingTime} min read</span>
                          </>
                        )}
                        
                        {article.views !== undefined && article.views > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {article.views}
                            </span>
                          </>
                        )}
                        
                        {article.commentCount !== undefined && article.commentCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{article.commentCount} {article.commentCount === 1 ? 'comment' : 'comments'}</span>
                          </>
                        )}
                        
                        {article.updatedAt && article.updatedAt !== article.createdAt && (
                          <>
                            <span>•</span>
                            <span>Updated {new Date(article.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No articles yet in this category.</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
