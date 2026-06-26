import type { BlogPost } from "@/types/blog";

type BlogLocation = BlogPost["location"];

export type BlogAutofillResult = {
  title: string;
  slug: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  location: BlogLocation;
  tags: string[];
  contentHtml: string;
};

const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;

function clampText(input: string, max: number): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1).trimEnd()}…`;
}

function clampAtWord(input: string, max: number): string {
  const text = input.trim();
  if (!text) return "";
  if (text.length <= max) return text;
  const sliced = text.slice(0, max);
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace >= Math.floor(max * 0.6)) {
    return `${sliced.slice(0, lastSpace).trimEnd()}…`;
  }
  return `${sliced.trimEnd()}…`;
}

function firstSentenceOrClamp(input: string, max: number): string {
  const text = input.trim().replace(/\s+/g, " ");
  if (!text) return "";
  const sentenceEnd = text.search(/[.!?]\s/);
  if (sentenceEnd > 40 && sentenceEnd + 1 <= max) {
    return text.slice(0, sentenceEnd + 1).trim();
  }
  return clampAtWord(text, max);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Ubud neighborhood slugs — map path keywords to catalog URLs */
const UBUD_SUBAREA_SLUGS = [
  "gentong",
  "kedewatan",
  "keliki",
  "kemenuh",
  "lodtunduh",
  "mas",
  "peliatan",
  "penestanan",
  "petulu",
  "sayan",
  "singakerta",
  "sukawati",
  "tegallalang",
] as const;

function isPlaceholderHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    /^(\w+\.)?example\.(com|org|net)$/i.test(h) ||
    /^(\w+\.)?example$/i.test(h) ||
    /^(www\.)?placeholder\.(com|dev|org)$/i.test(h) ||
    /^(www\.)?(test|demo|sample|yoursite|yourdomain|mydomain|site|website)\.com$/i.test(h)
  );
}

function internalFromPath(pathname: string): string | null {
  const p = pathname.toLowerCase();
  for (const s of UBUD_SUBAREA_SLUGS) {
    if (
      p === `/${s}` ||
      p.startsWith(`/${s}/`) ||
      p.includes(`/${s}/`) ||
      p.endsWith(`/${s}`) ||
      p.includes(`${s}-villa`) ||
      p.includes(`villa-${s}`)
    ) {
      return `/properties/rent/ubud/${s}`;
    }
  }
  if (p.includes("seminyak")) return "/properties/rent/seminyak";
  if (p.includes("canggu")) return "/properties/rent/canggu";
  if (p.includes("sanur")) return "/properties/rent/sanur";
  if (p.includes("ubud")) return "/properties/rent/ubud";
  if (p.includes("villa") || p.includes("rental") || p.includes("property") || p.includes("listing")) {
    return "/properties/rent/ubud";
  }
  return null;
}

function normalizeInternalUrl(input: string): string {
  const url = input.trim();
  if (!url) return url;
  if (url.startsWith("/") || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("tel:")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname;
    const host = parsed.hostname.toLowerCase();
    const tail = `${host}${pathname.toLowerCase()}`;

    if (host.includes("balitrusted")) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    if (host === "localhost" || host.endsWith(".localhost")) {
      if (
        pathname.startsWith("/properties") ||
        pathname.startsWith("/blog") ||
        pathname.startsWith("/guides")
      ) {
        return `${pathname}${parsed.search}${parsed.hash}`;
      }
    }

    if (isPlaceholderHost(host)) {
      const fromPath = internalFromPath(pathname);
      if (fromPath) return fromPath;
      if (tail.includes("ubud")) return "/properties/rent/ubud";
      if (tail.includes("sanur")) return "/properties/rent/sanur";
      if (tail.includes("canggu")) return "/properties/rent/canggu";
      if (tail.includes("seminyak")) return "/properties/rent/seminyak";
      return "/properties/rent/ubud";
    }

    const fromPath = internalFromPath(pathname);
    if (fromPath) return fromPath;

    if (tail.includes("ubud")) return "/properties/rent/ubud";
    if (tail.includes("sanur")) return "/properties/rent/sanur";
    if (tail.includes("canggu")) return "/properties/rent/canggu";
    if (tail.includes("seminyak")) return "/properties/rent/seminyak";
    if (tail.includes("villa") || tail.includes("rental") || tail.includes("property")) {
      return "/properties/rent/ubud";
    }

    return url;
  } catch {
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(url)) {
      return normalizeInternalUrl(`https://${url}`);
    }
    return url;
  }
}

function decodeBasicHtmlEntities(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
}

/** Second pass: raw HTML from drafts may already contain &lt;a href&gt; */
function rewriteAnchorsInHtml(html: string): string {
  return html.replace(/\bhref="([^"]+)"/gi, (_full, href: string) => {
    const normalized = normalizeInternalUrl(decodeBasicHtmlEntities(href));
    const safe = normalized.replace(/"/g, "&quot;");
    return `href="${safe}"`;
  });
}

function applyInlineMarkdown(input: string): string {
  let out = escapeHtml(input);
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text: string, href: string) => {
    const safeHref = escapeHtml(normalizeInternalUrl(href));
    return `<a href="${safeHref}">${escapeHtml(text)}</a>`;
  });
  out = out.replace(/(^|[\s(])(https?:\/\/[^\s)]+)/g, (_m, lead: string, url: string) => {
    const safe = escapeHtml(normalizeInternalUrl(url));
    return `${lead}<a href="${safe}">${escapeHtml(url)}</a>`;
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return out;
}

function markdownToHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      i += 1;
      continue;
    }

    // "### Title" or "###Title" (models often omit space)
    const heading = line.match(/^(#{1,3})\s*(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const text = applyInlineMarkdown(heading[2].trim());
      html.push(`<h${level}>${text}</h${level}>`);
      i += 1;
      continue;
    }

    // "**Section title**" alone on a line (common GPT shape instead of ##)
    const boldLine = line.match(/^\*\*([^*]+)\*\*\s*$/);
    if (boldLine && boldLine[1].trim().length > 0) {
      const text = applyInlineMarkdown(boldLine[1].trim());
      html.push(`<h2>${text}</h2>`);
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, "");
        items.push(`<li><p>${applyInlineMarkdown(itemText)}</p></li>`);
        i += 1;
      }
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
        items.push(`<li><p>${applyInlineMarkdown(itemText)}</p></li>`);
        i += 1;
      }
      html.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraphLines = [line];
    i += 1;
    while (i < lines.length) {
      const peek = lines[i].trim();
      if (
        !peek ||
        /^(#{1,3})\s*/.test(peek) ||
        /^\*\*[^*]+\*\*\s*$/.test(peek) ||
        /^[-*]\s+/.test(peek) ||
        /^\d+\.\s+/.test(peek)
      ) {
        break;
      }
      paragraphLines.push(peek);
      i += 1;
    }
    html.push(`<p>${applyInlineMarkdown(paragraphLines.join(" "))}</p>`);
  }

  return html.join("\n");
}

function extractField(lines: string[], names: string[]): string | null {
  const escaped = names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const rx = new RegExp(`^\\s*(?:${escaped})\\s*:\\s*(.+)\\s*$`, "i");
  for (const line of lines) {
    const m = line.match(rx);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

function guessLocation(input: string): BlogLocation {
  const low = input.toLowerCase();
  if (low.includes("sanur")) return "sanur";
  if (low.includes("ubud")) return "ubud";
  return "other";
}

function collectTags(text: string, explicit?: string): string[] {
  if (explicit) {
    return explicit
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 12);
  }

  const low = text.toLowerCase();
  const seed = ["bali", "villa", "real estate", "rent"];
  const keywordMap: Array<[string, string]> = [
    ["ubud", "ubud"],
    ["sanur", "sanur"],
    ["canggu", "canggu"],
    ["seminyak", "seminyak"],
    ["long-term", "long-term rental"],
    ["yearly", "yearly rent"],
    ["monthly", "monthly rent"],
    ["investment", "investment"],
  ];
  for (const [needle, tag] of keywordMap) {
    if (low.includes(needle)) seed.push(tag);
  }
  return Array.from(new Set(seed)).slice(0, 12);
}

function removeMetaLines(lines: string[]): string[] {
  return lines.filter(
    (line) =>
      !/^\s*(title|h1|seo\s*title|meta\s*title|seo\s*description|meta\s*description|description|summary|slug|tags|location)\s*:/i.test(
        line
      )
  );
}

function normalizeHeadingText(line: string): string {
  return line
    .replace(/^#+\s*/, "")
    .replace(/^\*\*([^*]+)\*\*$/, "$1")
    .trim()
    .toLowerCase();
}

/** Drop first body line if it repeats the article title (common in pasted drafts). */
function stripDuplicateLeadTitle(body: string, title: string): string {
  const t = title.trim();
  if (!t) return body;
  const rawLines = body.split("\n");
  let i = 0;
  while (i < rawLines.length && !rawLines[i].trim()) i += 1;
  if (i >= rawLines.length) return body;
  const first = rawLines[i].trim();
  if (normalizeHeadingText(first) === normalizeHeadingText(t)) {
    return rawLines.slice(i + 1).join("\n").trim();
  }
  return body;
}

export function buildBlogAutofill(rawText: string): BlogAutofillResult {
  const normalized = rawText.replace(/\r\n?/g, "\n").trim();
  const lines = normalized.split("\n");

  const titleFromField = extractField(lines, ["title", "h1"]);
  const headingLine = lines.find((line) => /^#\s+/.test(line.trim()))?.replace(/^#\s+/, "").trim();
  const firstMeaningful = lines.find((line) => line.trim().length > 0)?.trim() ?? "";
  const title = (titleFromField || headingLine || firstMeaningful || "New blog post").slice(0, 120);

  const summaryField = extractField(lines, ["summary", "description", "meta description", "seo description"]);
  const contentLines = removeMetaLines(lines);
  let markdownBody = contentLines.join("\n").trim();
  markdownBody = stripDuplicateLeadTitle(markdownBody, title);
  const contentHtml = rewriteAnchorsInHtml(markdownToHtml(markdownBody || title));

  const plainBody = markdownBody
    .replace(/[#*_`>\-\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const summary = firstSentenceOrClamp(summaryField || plainBody, 220);
  const seoTitle = clampText(extractField(lines, ["seo title", "meta title"]) || title, SEO_TITLE_MAX);
  const seoDescription = clampText(
    extractField(lines, ["seo description", "meta description", "description"]) || summary || plainBody,
    SEO_DESC_MAX
  );
  const slug = slugify(extractField(lines, ["slug"]) || title) || `post-${Date.now()}`;
  const locationField = extractField(lines, ["location"]);
  const location = locationField ? guessLocation(locationField) : guessLocation(`${title}\n${plainBody}`);
  const tags = collectTags(`${title}\n${plainBody}`, extractField(lines, ["tags"]) || undefined);

  return {
    title,
    slug,
    summary,
    seoTitle,
    seoDescription,
    ogTitle: seoTitle || title,
    ogDescription: seoDescription || summary,
    canonicalUrl: `/blog/${slug}`,
    location,
    tags,
    contentHtml,
  };
}
