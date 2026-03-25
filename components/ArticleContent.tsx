"use client";

import { useEffect } from "react";

interface ArticleContentProps {
  content: string;
}

// Normalize ID - convert to lowercase and handle special cases
function normalizeId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ArticleContent({ content }: ArticleContentProps) {
  useEffect(() => {
    // Add IDs to all headings automatically if they don't have one
    const headings = document.querySelectorAll('.prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6');
    headings.forEach((heading) => {
      if (!heading.id) {
        // Generate ID from text content
        const text = heading.textContent || '';
        const id = normalizeId(text);
        heading.id = id;
      }
    });

    // Normalize all anchor links to use lowercase IDs
    const links = document.querySelectorAll('.prose a[href^="#"]');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const id = href.substring(1);
        const normalizedId = normalizeId(id);
        if (id !== normalizedId) {
          link.setAttribute('href', `#${normalizedId}`);
        }
      }
    });
  }, [content]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (href) {
        const id = normalizeId(href.substring(1));
        
        // Try to find element by normalized ID
        let element = document.getElementById(id);
        
        // If not found, try to find by original ID (case-insensitive)
        if (!element) {
          const allElements = document.querySelectorAll('[id]');
          for (let el of allElements) {
            if (normalizeId(el.id) === id) {
              element = el as HTMLElement;
              break;
            }
          }
        }
        
        if (element) {
          const offset = 80; // Offset for fixed header if any
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
          
          // Update URL without reload
          window.history.pushState(null, '', `#${id}`);
        } else {
          console.warn(`Element with ID "${id}" not found`);
        }
      }
    }
  };

  return (
    <div 
      className="
        prose prose-lg max-w-none
        prose-hr:hidden
        prose-headings:tracking-tight
        prose-h2:text-base prose-h2:leading-snug prose-h2:mt-2 prose-h2:mb-1
        prose-h3:text-sm prose-h3:leading-snug prose-h3:mt-2 prose-h3:mb-1
        prose-p:mt-2 prose-p:mb-2
        prose-ul:my-2 prose-ul:pl-0 prose-ul:list-none
        prose-ol:my-2 prose-ol:pl-0 prose-ol:list-none
        prose-li:my-1 prose-li:pl-0
        prose-blockquote:bg-stone-50 prose-blockquote:rounded-xl prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:my-4
      "
      dangerouslySetInnerHTML={{ __html: content }}
      onClick={handleClick}
    />
  );
}
