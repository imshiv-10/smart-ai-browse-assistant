import { invoke } from '@tauri-apps/api/core';
import type { PageContent, SummaryResponse, ComparisonResponse, ChatMessage, HealthStatus, Settings } from '@/types';

// Fetch and extract content from a URL
export async function fetchUrlContent(url: string): Promise<PageContent> {
  return invoke<PageContent>('fetch_url_content', { url });
}

// Summarize content using the backend
export async function summarizeContent(content: PageContent, backendUrl: string): Promise<SummaryResponse> {
  return invoke<SummaryResponse>('summarize_content', { content, backendUrl });
}

// Compare products
export async function compareProducts(
  url: string,
  content: PageContent,
  backendUrl: string
): Promise<ComparisonResponse> {
  return invoke<ComparisonResponse>('compare_products', { url, content, backendUrl });
}

// Chat with AI
export async function chatWithAI(
  messages: { role: string; content: string }[],
  context: PageContent,
  backendUrl: string
): Promise<ChatMessage> {
  return invoke<ChatMessage>('chat_with_ai', { messages, context, backendUrl });
}

// Check backend health
export async function checkBackendHealth(backendUrl: string): Promise<HealthStatus> {
  return invoke<HealthStatus>('check_backend_health', { backendUrl });
}

// Get settings
export async function getSettings(): Promise<Settings> {
  return invoke<Settings>('get_settings');
}

// Save settings
export async function saveSettings(settings: Settings): Promise<Settings> {
  return invoke<Settings>('save_settings', { settings });
}
