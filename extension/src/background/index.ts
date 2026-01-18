import browser from 'webextension-polyfill';
import type {
  Message,
  PageContent,
  Settings,
  ChatMessage,
  SummaryResponse,
  ComparisonResponse,
} from '@/shared/types';
import { ApiClient } from '@/shared/api';
import { StorageManager } from '@/shared/storage';

const storage = new StorageManager();
let apiClient: ApiClient;

// Initialize the extension
async function initialize(): Promise<void> {
  const settings = await storage.getSettings();
  apiClient = new ApiClient(settings);

  // Set up side panel behavior (Chrome only)
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  }

  console.log('Smart Browse Assistant initialized');
}

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener(
  (message: Message, sender): Promise<unknown> | undefined => {
    switch (message.type) {
      case 'GET_PAGE_CONTENT':
        return handleGetPageContent(sender.tab?.id);

      case 'SUMMARIZE':
        return handleSummarize(message.payload as PageContent);

      case 'COMPARE_PRODUCT':
        return handleCompareProduct(message.payload as { url: string; content: PageContent });

      case 'CHAT':
        return handleChat(message.payload as { messages: ChatMessage[]; context: PageContent });

      case 'GET_SETTINGS':
        return storage.getSettings();

      case 'UPDATE_SETTINGS':
        return handleUpdateSettings(message.payload as Partial<Settings>);

      case 'OPEN_SIDE_PANEL':
        return handleOpenSidePanel(sender.tab?.id);

      default:
        console.warn('Unknown message type:', message.type);
        return undefined;
    }
  }
);

// Get page content from the active tab
async function handleGetPageContent(tabId?: number): Promise<PageContent | null> {
  if (!tabId) {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    tabId = tabs[0]?.id;
  }

  if (!tabId) {
    return null;
  }

  try {
    const response = await browser.tabs.sendMessage(tabId, { type: 'EXTRACT_CONTENT' });
    return response as PageContent;
  } catch (error) {
    console.error('Failed to get page content:', error);
    return null;
  }
}

// Summarize page content
async function handleSummarize(content: PageContent): Promise<SummaryResponse> {
  const settings = await storage.getSettings();
  const contentLength = content.text.length;

  // Route to local LLM for short content, backend for longer content
  if (settings.useLocalLLM && contentLength < settings.localLLMThreshold) {
    try {
      return await apiClient.summarizeLocal(content);
    } catch (error) {
      console.warn('Local LLM failed, falling back to backend:', error);
    }
  }

  return await apiClient.summarizeRemote(content);
}

// Compare product with alternatives
async function handleCompareProduct(
  payload: { url: string; content: PageContent }
): Promise<ComparisonResponse> {
  return await apiClient.compareProduct(payload.url, payload.content);
}

// Handle chat messages
async function handleChat(
  payload: { messages: ChatMessage[]; context: PageContent }
): Promise<ChatMessage> {
  const settings = await storage.getSettings();
  const contextLength = payload.context.text.length;

  // Use local LLM for shorter contexts
  if (settings.useLocalLLM && contextLength < settings.localLLMThreshold) {
    try {
      return await apiClient.chatLocal(payload.messages, payload.context);
    } catch (error) {
      console.warn('Local LLM failed, falling back to backend:', error);
    }
  }

  return await apiClient.chatRemote(payload.messages, payload.context);
}

// Update settings
async function handleUpdateSettings(newSettings: Partial<Settings>): Promise<Settings> {
  const settings = await storage.updateSettings(newSettings);
  apiClient = new ApiClient(settings);
  return settings;
}

// Open side panel (Chrome only)
async function handleOpenSidePanel(tabId?: number): Promise<void> {
  if (chrome.sidePanel && tabId) {
    await chrome.sidePanel.open({ tabId });
  }
}

// Handle extension installation
browser.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings
    await storage.setDefaultSettings();
    console.log('Extension installed, default settings applied');
  }
});

// Handle keyboard shortcuts
browser.commands?.onCommand?.addListener(async (command) => {
  if (command === 'toggle-sidebar') {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (tabId) {
      await handleOpenSidePanel(tabId);
    }
  }
});

// Initialize on script load
initialize();
