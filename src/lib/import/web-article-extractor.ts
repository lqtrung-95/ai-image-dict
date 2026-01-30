/**
 * Web Article Content Extractor
 * Extracts main content from web pages for vocabulary import
 */

export interface ExtractedArticle {
  title: string;
  content: string;
  url: string;
}

/**
 * Remove HTML tags and decode entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract main content from HTML
 */
function extractMainContent(html: string): string {
  // Try to find article or main content containers
  const contentPatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="content"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = html.match(pattern);
    if (match && match[1].length > 500) {
      return stripHtml(match[1]);
    }
  }

  // Fallback: extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return stripHtml(bodyMatch[1]);
  }

  return stripHtml(html);
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string {
  // Try og:title first
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
  if (ogTitleMatch) return ogTitleMatch[1];

  // Try h1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return stripHtml(h1Match[1]);

  // Fallback to title tag
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  return 'Untitled Article';
}

/**
 * Validate URL is safe to fetch
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Block localhost and internal IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return false;
    }
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Extract article content from a URL
 */
export async function extractWebArticle(url: string): Promise<ExtractedArticle> {
  if (!isValidUrl(url)) {
    throw new Error('Invalid or unsafe URL');
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AIImageDict/1.0; +https://ai-image-dict.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      throw new Error('URL does not point to an HTML page');
    }

    const html = await response.text();
    const title = extractTitle(html);
    let content = extractMainContent(html);

    // Limit content size to prevent timeout/cost issues
    const MAX_CONTENT_LENGTH = 50000;
    if (content.length > MAX_CONTENT_LENGTH) {
      content = content.slice(0, MAX_CONTENT_LENGTH) + '...';
    }

    if (content.length < 100) {
      throw new Error('Could not extract meaningful content from this page');
    }

    return { title, content, url };
  } catch (error) {
    console.error('Web extraction error:', error);
    throw new Error(
      error instanceof Error
        ? `Failed to extract article: ${error.message}`
        : 'Failed to extract article content'
    );
  }
}
