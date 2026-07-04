import axios from 'axios';
import * as cheerio from 'cheerio';

const MAX_PAGES = 5;
const TIMEOUT = 5000;

const IGNORE_PATTERNS = [
  /login/i, /signin/i, /signup/i, /register/i,
  /cart/i, /checkout/i, /privacy/i, /terms/i,
  /cookie/i, /admin/i, /dashboard/i, /account/i,
  /auth/i, /\.(pdf|jpg|jpeg|png|gif|mp4|avi|mp3|svg|webp|css|js|woff2?)$/i
];

function shouldIgnore(url: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(url));
}

function extractContent($: cheerio.CheerioAPI): string {
  // Remove script, style, nav, footer, header to avoid noise
  $('script, style, nav, footer, header, noscript, iframe, .nav, .footer, .menu').remove();
  
  // Extract text and clean it up (remove extra whitespace)
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return text;
}

export async function crawlWebsite(startUrl: string, onProgress?: (msg: string) => void): Promise<string> {
  const visited = new Set<string>();
  const toVisit = [startUrl];
  let fullText = '';
  
  let domain = '';
  try {
    domain = new URL(startUrl).hostname;
  } catch (e) {
    console.error('Invalid start URL:', startUrl);
    return '';
  }

  while (toVisit.length > 0 && visited.size < MAX_PAGES) {
    const currentUrl = toVisit.shift()!;
    
    if (visited.has(currentUrl) || shouldIgnore(currentUrl)) {
      continue;
    }

    try {
      if (onProgress) onProgress(`Crawling: ${currentUrl}`);
      
      const response = await axios.get(currentUrl, {
        timeout: TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 AI-Company-Research-Bot/1.0'
        }
      });
      
      visited.add(currentUrl);
      
      const html = typeof response.data === 'string' ? response.data : '';
      if (!html) continue;

      const $ = cheerio.load(html);
      
      // Extract content
      const pageText = extractContent($);
      if (pageText) {
        // limit text per page to avoid exploding token counts
        fullText += `\n--- Page: ${currentUrl} ---\n${pageText.substring(0, 3000)}`; 
      }

      // Discover links on the same domain
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        
        try {
          const newUrl = new URL(href, currentUrl);
          if (
            newUrl.hostname === domain && 
            (newUrl.protocol === 'http:' || newUrl.protocol === 'https:')
          ) {
            newUrl.hash = ''; // normalize by removing anchor
            const normalized = newUrl.toString();
            if (!visited.has(normalized) && !toVisit.includes(normalized) && !shouldIgnore(normalized)) {
              toVisit.push(normalized);
            }
          }
        } catch (e) {
          // ignore invalid urls
        }
      });

    } catch (error) {
      console.warn(`Failed to crawl ${currentUrl}:`, error instanceof Error ? error.message : String(error));
      visited.add(currentUrl); // mark as visited so we don't retry endlessly
    }
  }

  return fullText;
}
