import { MetadataRoute } from 'next'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { parsePropertiesFile } from '@/lib/parseProperties'
import { getArticles } from '@/lib/articlesData'
import { getBlogPosts } from '@/lib/blogData'
import { loadAllProperties, filterProperties, parseSegment, SEGMENT_TYPES } from '@/lib/propertiesCatalog'
import { buildPropertySlugIndex } from '@/lib/propertySlug'
import type { PropertyType, MainArea } from '@/types/property'

// Use env or localhost so site works before domain is connected
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

type CatalogTypeSlug = PropertyType | 'villas'
const propertyTypes: CatalogTypeSlug[] = ['rent', 'sale', 'villas', 'land', 'business']
const mainAreas = ['ubud', 'canggu', 'sanur', 'seminyak', 'tanah-lot'] as const
const guideCategories = ['rent', 'buy', 'land', 'legal', 'ubud', 'areas', 'risks']

const segmentSlugs = [
  ...SEGMENT_TYPES.subArea,
  ...SEGMENT_TYPES.bedroom,
  ...SEGMENT_TYPES.payment,
  ...SEGMENT_TYPES.amenity,
] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/site-map`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/qa`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/request`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  let propertyPages: MetadataRoute.Sitemap = []
  try {
    const all = await loadAllProperties()
    propertyPages = propertyTypes.flatMap((type) => {
      const typePages: MetadataRoute.Sitemap = []
      const typeFiltered = filterProperties(all, { type })
      if (typeFiltered.length > 0) {
        typePages.push({
          url: `${baseUrl}/properties/${type}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.85,
        })
      }
      for (const area of mainAreas) {
        const filtered = filterProperties(all, { type, mainArea: area as MainArea })
        if (filtered.length > 0) {
          typePages.push({
            url: `${baseUrl}/properties/${type}/${area}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.85,
          })
          if (area === 'ubud') {
            for (const segSlug of segmentSlugs) {
              const parsed = parseSegment(segSlug, area as MainArea, type)
              if (parsed) {
                const segFiltered = filterProperties(all, { type, mainArea: area as MainArea }, parsed)
                if (segFiltered.length > 0) {
                  typePages.push({
                    url: `${baseUrl}/properties/${type}/${area}/${segSlug}`,
                    lastModified: new Date(),
                    changeFrequency: 'daily' as const,
                    priority: 0.8,
                  })
                }
              }
            }
          }
        }
      }
      return typePages
    })
  } catch (e) {
    console.error('Error building property sitemap:', e)
    propertyPages = propertyTypes.flatMap((type) => [
      { url: `${baseUrl}/properties/${type}`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.85 },
      ...mainAreas.map((area) => ({
        url: `${baseUrl}/properties/${type}/${area}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.85,
      })),
    ])
  }

  const guideCategoryPages: MetadataRoute.Sitemap = guideCategories.map((slug) => ({
    url: `${baseUrl}/guides/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Add individual property pages (villas)
  let propertyDetailPages: MetadataRoute.Sitemap = []
  try {
    const filePath = join(process.cwd(), 'data', 'properties.ts')
    const fileContent = await readFile(filePath, 'utf-8')
    const properties = parsePropertiesFile(fileContent)
    const forSitemap = properties.filter((p) => {
      const hasPrice =
        p?.price &&
        (typeof p.price.min === 'number' ||
          typeof p.price.monthly === 'number' ||
          typeof p.price.yearly === 'number' ||
          typeof p.price.forSale === 'number')
      return p && p.id && hasPrice
    })
    const slugIdx = buildPropertySlugIndex(forSitemap)

    // Only include non-archived properties
    propertyDetailPages = forSitemap
      .filter((p) => !p.archived && p.id)
      .map((property) => ({
        url: `${baseUrl.replace(/\/$/, '')}${slugIdx.pathFor(property)}`,
        lastModified: property.updatedAt ? new Date(property.updatedAt) : new Date(property.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8, // High priority for individual properties
      }))
  } catch (error) {
    console.error('Error loading properties for sitemap:', error)
    // Continue without property pages if file can't be read
  }

  // Add individual article pages (Knowledge Base)
  let articlePages: MetadataRoute.Sitemap = []
  try {
    const articles = await getArticles()
    articlePages = articles
      .filter((a) => a.published && a.slug && a.category)
      .map((article) => ({
        url: `${baseUrl}/guides/${article.category}/${article.slug}`,
        lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(article.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  } catch (error) {
    console.error('Error loading articles for sitemap:', error)
  }

  // Add individual blog post pages
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const posts = await getBlogPosts()
    blogPages = posts
      .filter((p) => p.slug)
      .map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(post.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.65,
      }))
  } catch (error) {
    console.error('Error loading blog posts for sitemap:', error)
  }

  return [...staticPages, ...propertyPages, ...guideCategoryPages, ...propertyDetailPages, ...articlePages, ...blogPages]
}
