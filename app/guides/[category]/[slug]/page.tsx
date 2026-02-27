import { notFound } from "next/navigation";
import Link from "next/link";
import { Article } from "@/types/article";
import { readFile } from "fs/promises";
import { join } from "path";
import Image from "next/image";
import ArticleComments from "@/components/ArticleComments";
import ArticleContent from "@/components/ArticleContent";
import ArticleViewTracker from "@/components/ArticleViewTracker";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArticle(category: string, slug: string): Promise<Article | null> {
  try {
    const { articles } = await import("@/data/articles");
    return articles.find(a => a.category === category && a.slug === slug && a.published) || null;
  } catch (error) {
    console.error("Error loading article:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const article = await getArticle(category, slug);
  
  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt || article.content.substring(0, 160),
    keywords: article.seoKeywords?.join(", "),
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const article = await getArticle(category, slug);

  if (!article) {
    notFound();
  }

  const categoryNames: Record<string, string> = {
    ubud: "Ubud",
    rent: "Rental (long-stay)",
    buy: "Purchase and Investments",
    land: "Land",
    legal: "Legal and Safety",
    areas: "Areas",
    risks: "Mistakes and Reality",
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <nav className="mb-8 text-sm text-gray-600">
            <Link href="/guides" className="hover:text-gray-900">Knowledge Base</Link>
            <span className="mx-2">/</span>
            <Link href={`/guides/${category}`} className="hover:text-gray-900">
              {categoryNames[category] || category}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{article.title}</span>
          </nav>

          <ArticleViewTracker articleId={article.id} />
          
          <article>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-8">
              <span>By {article.author}</span>
              {article.publishedAt && (
                <span>• {new Date(article.publishedAt).toLocaleDateString()}</span>
              )}
              {article.tags.length > 0 && (
                <div className="flex gap-2">
                  {article.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {article.featuredImage && (
              <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
                <Image
                  src={article.featuredImage}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              </div>
            )}

            {article.excerpt && (
              <p className="text-xl text-gray-700 mb-8 italic">
                {article.excerpt}
              </p>
            )}
            
            <ArticleContent content={article.content} />
          </article>

          {article.allowComments && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <ArticleComments articleId={article.id} />
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/guides"
              className="text-gray-900 hover:text-gray-700 font-medium"
            >
              ← Back to Knowledge Base
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
