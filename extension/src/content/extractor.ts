import browser from 'webextension-polyfill';
import type { PageContent, PageType, ProductInfo } from '@/shared/types';

// Listen for extraction requests from background script
browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'EXTRACT_CONTENT') {
    return Promise.resolve(extractPageContent());
  }
  return undefined;
});

// Main extraction function
function extractPageContent(): PageContent {
  const pageType = detectPageType();
  const content: PageContent = {
    url: window.location.href,
    title: document.title,
    description: getMetaDescription(),
    text: extractMainText(),
    pageType,
    extractedAt: new Date().toISOString(),
  };

  // Extract additional data based on page type
  if (pageType === 'product') {
    content.product = extractProductInfo();
  }

  if (pageType === 'article') {
    content.article = extractArticleInfo();
  }

  return content;
}

// Detect page type based on content and URL patterns
function detectPageType(): PageType {
  const url = window.location.href.toLowerCase();
  const hostname = window.location.hostname;

  // Check for product pages
  const productIndicators = [
    // URL patterns
    /\/product\//i,
    /\/item\//i,
    /\/dp\//i, // Amazon
    /\/p\//i,
    /\/pd\//i,
    // Schema.org markup
    document.querySelector('[itemtype*="schema.org/Product"]'),
    document.querySelector('[typeof="Product"]'),
    // Common product page elements
    document.querySelector('[data-product-id]'),
    document.querySelector('.product-price, .price, [class*="price"]'),
    document.querySelector('button[class*="cart"], button[class*="buy"]'),
  ];

  if (productIndicators.some(Boolean)) {
    return 'product';
  }

  // Check for article pages
  const articleIndicators = [
    document.querySelector('article'),
    document.querySelector('[itemtype*="schema.org/Article"]'),
    document.querySelector('[itemtype*="schema.org/NewsArticle"]'),
    document.querySelector('[itemtype*="schema.org/BlogPosting"]'),
    document.querySelector('.article-content, .post-content, .entry-content'),
  ];

  if (articleIndicators.some(Boolean)) {
    return 'article';
  }

  // Check for search results pages
  if (
    url.includes('search') ||
    url.includes('q=') ||
    url.includes('query=') ||
    hostname.includes('google') ||
    hostname.includes('bing') ||
    hostname.includes('duckduckgo')
  ) {
    return 'search';
  }

  return 'other';
}

// Get meta description
function getMetaDescription(): string {
  const metaDesc = document.querySelector('meta[name="description"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  return (
    metaDesc?.getAttribute('content') ||
    ogDesc?.getAttribute('content') ||
    ''
  );
}

// Extract main text content from the page
function extractMainText(): string {
  // Priority order for finding main content
  const mainContentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '.content',
    '.post-content',
    '.article-content',
    '.entry-content',
    '#content',
    '#main',
  ];

  let mainElement: Element | null = null;

  for (const selector of mainContentSelectors) {
    mainElement = document.querySelector(selector);
    if (mainElement) break;
  }

  // Fallback to body if no main content found
  if (!mainElement) {
    mainElement = document.body;
  }

  // Clone to avoid modifying the actual page
  const clone = mainElement.cloneNode(true) as Element;

  // Remove unwanted elements
  const unwantedSelectors = [
    'script',
    'style',
    'nav',
    'header',
    'footer',
    'aside',
    '.sidebar',
    '.advertisement',
    '.ad',
    '[role="banner"]',
    '[role="navigation"]',
    '[role="complementary"]',
    '.comments',
    '.comment-section',
    '.social-share',
    '.related-posts',
  ];

  unwantedSelectors.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Get text content and clean it up
  let text = clone.textContent || '';

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // Limit text length to prevent token overflow
  const maxLength = 50000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }

  return text;
}

// Extract product information
function extractProductInfo(): ProductInfo {
  const product: ProductInfo = {
    name: extractProductName(),
    price: extractPrice(),
    currency: extractCurrency(),
    images: extractImages(),
    description: extractProductDescription(),
    rating: extractRating(),
    reviewCount: extractReviewCount(),
    availability: extractAvailability(),
    brand: extractBrand(),
    category: extractCategory(),
  };

  return product;
}

// Extract product name
function extractProductName(): string {
  const selectors = [
    '[itemprop="name"]',
    'h1[class*="product"]',
    'h1[class*="title"]',
    '.product-title',
    '.product-name',
    '#productTitle', // Amazon
    '[data-testid="product-title"]',
    'h1',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      return el.textContent.trim();
    }
  }

  return document.title;
}

// Extract price
function extractPrice(): number | undefined {
  const priceSelectors = [
    '[itemprop="price"]',
    '.price',
    '.product-price',
    '[class*="price"]',
    '[data-testid*="price"]',
    '#priceblock_ourprice', // Amazon
    '#priceblock_dealprice',
    '.a-price .a-offscreen', // Amazon
  ];

  for (const selector of priceSelectors) {
    const el = document.querySelector(selector);
    const priceAttr = el?.getAttribute('content');
    const priceText = priceAttr || el?.textContent || '';

    const match = priceText.match(/[\d,]+\.?\d*/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
  }

  return undefined;
}

// Extract currency
function extractCurrency(): string {
  const currencyMeta = document.querySelector('[itemprop="priceCurrency"]');
  if (currencyMeta) {
    return currencyMeta.getAttribute('content') || 'USD';
  }

  const priceText = document.querySelector('.price, [class*="price"]')?.textContent || '';

  if (priceText.includes('$')) return 'USD';
  if (priceText.includes('€')) return 'EUR';
  if (priceText.includes('£')) return 'GBP';
  if (priceText.includes('¥')) return 'JPY';

  return 'USD';
}

// Extract product images
function extractImages(): string[] {
  const images: string[] = [];
  const selectors = [
    '[itemprop="image"]',
    '.product-image img',
    '[class*="product"] img',
    '[data-testid*="image"] img',
    '#landingImage', // Amazon
  ];

  for (const selector of selectors) {
    document.querySelectorAll(selector).forEach((el) => {
      const src = el.getAttribute('src') || el.getAttribute('data-src');
      if (src && !src.includes('placeholder')) {
        images.push(src);
      }
    });
  }

  return images.slice(0, 5);
}

// Extract product description
function extractProductDescription(): string {
  const selectors = [
    '[itemprop="description"]',
    '.product-description',
    '.description',
    '#productDescription', // Amazon
    '[data-testid="product-description"]',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      return el.textContent.trim().substring(0, 2000);
    }
  }

  return '';
}

// Extract rating
function extractRating(): number | undefined {
  const ratingSelectors = [
    '[itemprop="ratingValue"]',
    '.rating',
    '[class*="rating"]',
    '[data-testid*="rating"]',
  ];

  for (const selector of ratingSelectors) {
    const el = document.querySelector(selector);
    const content = el?.getAttribute('content') || el?.textContent || '';
    const match = content.match(/(\d+\.?\d*)/);
    if (match) {
      const rating = parseFloat(match[1]);
      if (rating > 0 && rating <= 5) {
        return rating;
      }
    }
  }

  return undefined;
}

// Extract review count
function extractReviewCount(): number | undefined {
  const reviewSelectors = [
    '[itemprop="reviewCount"]',
    '.review-count',
    '[class*="review"]',
    '#acrCustomerReviewText', // Amazon
  ];

  for (const selector of reviewSelectors) {
    const el = document.querySelector(selector);
    const content = el?.getAttribute('content') || el?.textContent || '';
    const match = content.match(/(\d+[\d,]*)/);
    if (match) {
      return parseInt(match[1].replace(/,/g, ''), 10);
    }
  }

  return undefined;
}

// Extract availability
function extractAvailability(): string {
  const availabilitySelectors = [
    '[itemprop="availability"]',
    '.availability',
    '#availability', // Amazon
    '[data-testid*="availability"]',
  ];

  for (const selector of availabilitySelectors) {
    const el = document.querySelector(selector);
    const content = el?.getAttribute('content') || el?.textContent || '';
    if (content.toLowerCase().includes('in stock')) {
      return 'in_stock';
    }
    if (content.toLowerCase().includes('out of stock')) {
      return 'out_of_stock';
    }
  }

  return 'unknown';
}

// Extract brand
function extractBrand(): string {
  const brandSelectors = [
    '[itemprop="brand"]',
    '.brand',
    '[class*="brand"]',
    '#bylineInfo', // Amazon
  ];

  for (const selector of brandSelectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      return el.textContent.trim();
    }
  }

  return '';
}

// Extract category
function extractCategory(): string {
  const categorySelectors = [
    '[itemprop="category"]',
    '.breadcrumb',
    '[class*="breadcrumb"]',
    'nav[aria-label="Breadcrumb"]',
  ];

  for (const selector of categorySelectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      return el.textContent.trim().replace(/\s*[>\/]\s*/g, ' > ');
    }
  }

  return '';
}

// Extract article information
function extractArticleInfo() {
  return {
    author: extractAuthor(),
    publishDate: extractPublishDate(),
    readingTime: estimateReadingTime(),
  };
}

// Extract author
function extractAuthor(): string {
  const authorSelectors = [
    '[itemprop="author"]',
    '[rel="author"]',
    '.author',
    '.byline',
    '[class*="author"]',
  ];

  for (const selector of authorSelectors) {
    const el = document.querySelector(selector);
    if (el?.textContent?.trim()) {
      return el.textContent.trim();
    }
  }

  return '';
}

// Extract publish date
function extractPublishDate(): string {
  const dateSelectors = [
    '[itemprop="datePublished"]',
    'time[datetime]',
    '.publish-date',
    '.post-date',
    '[class*="date"]',
  ];

  for (const selector of dateSelectors) {
    const el = document.querySelector(selector);
    const datetime = el?.getAttribute('datetime');
    if (datetime) return datetime;
    if (el?.textContent?.trim()) {
      return el.textContent.trim();
    }
  }

  return '';
}

// Estimate reading time
function estimateReadingTime(): number {
  const text = extractMainText();
  const wordCount = text.split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Export for testing
export { extractPageContent, detectPageType, extractProductInfo };
