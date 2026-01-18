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
  pageType: PageType;
  extractedAt: string;
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

// Chat session
export interface ChatSession {
  id: string;
  pageUrl: string;
  pageTitle: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// Summary response
export interface SummaryResponse {
  summary: string;
  keyPoints: string[];
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
  currentProduct: ProductInfo;
  alternatives: ProductAlternative[];
  verdict: string;
  prosConsAnalysis: {
    current: {
      pros: string[];
      cons: string[];
    };
    alternatives: Array<{
      name: string;
      pros: string[];
      cons: string[];
    }>;
  };
  recommendation?: string;
}

// Message types for extension communication
export type MessageType =
  | 'GET_PAGE_CONTENT'
  | 'EXTRACT_CONTENT'
  | 'SUMMARIZE'
  | 'COMPARE_PRODUCT'
  | 'CHAT'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'OPEN_SIDE_PANEL';

export interface Message {
  type: MessageType;
  payload?: unknown;
}

// Settings
export interface Settings {
  backendUrl: string;
  localLLMUrl: string;
  useLocalLLM: boolean;
  localLLMThreshold: number;
  theme: 'light' | 'dark' | 'system';
  maxHistoryLength: number;
  autoSummarize: boolean;
}

// API error
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, unknown>;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// LLM provider types
export type LLMProvider = 'local' | 'backend' | 'openai' | 'anthropic';

// Stream response chunk
export interface StreamChunk {
  content: string;
  done: boolean;
}
