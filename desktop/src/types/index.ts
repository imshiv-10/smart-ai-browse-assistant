// Page types
export type PageType = 'product' | 'article' | 'search' | 'other';

// Product information
export interface ProductInfo {
  name: string;
  price?: number;
  currency: string;
  images: string[];
  description: string;
  rating?: number;
  reviewCount?: number;
  availability: string;
  brand: string;
  category: string;
}

// Article information
export interface ArticleInfo {
  author: string;
  publishDate: string;
  readingTime: number;
}

// Extracted page content
export interface PageContent {
  url: string;
  title: string;
  description: string;
  text: string;
  page_type: PageType;
  extracted_at: string;
  product?: ProductInfo;
  article?: ArticleInfo;
}

// Chat messages
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Summary response
export interface SummaryResponse {
  summary: string;
  key_points: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
}

// Product alternative
export interface ProductAlternative {
  name: string;
  price?: number;
  currency: string;
  url: string;
  image?: string;
  rating?: number;
  source: string;
}

// Comparison response
export interface ComparisonResponse {
  alternatives: ProductAlternative[];
  verdict: string;
}

// Settings
export interface Settings {
  backendUrl: string;
  localLlmUrl: string;
  theme: 'light' | 'dark' | 'system';
  autoSummarize: boolean;
  language: string;
}

// Health status
export interface HealthStatus {
  status: string;
  version: string;
  llm_status: string;
}
