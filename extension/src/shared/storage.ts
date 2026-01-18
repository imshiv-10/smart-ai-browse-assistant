import browser from 'webextension-polyfill';
import type { Settings, ChatSession, ChatMessage } from './types';

const DEFAULT_SETTINGS: Settings = {
  backendUrl: 'http://localhost:8000',
  localLLMUrl: 'http://localhost:1234',
  useLocalLLM: true,
  localLLMThreshold: 4000,
  theme: 'system',
  maxHistoryLength: 50,
  autoSummarize: false,
};

const STORAGE_KEYS = {
  SETTINGS: 'settings',
  CHAT_SESSIONS: 'chat_sessions',
  CURRENT_SESSION: 'current_session',
} as const;

export class StorageManager {
  // Get settings
  async getSettings(): Promise<Settings> {
    const result = await browser.storage.local.get(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
  }

  // Update settings
  async updateSettings(newSettings: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    await browser.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
    return updated;
  }

  // Set default settings
  async setDefaultSettings(): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
  }

  // Get all chat sessions
  async getChatSessions(): Promise<ChatSession[]> {
    const result = await browser.storage.local.get(STORAGE_KEYS.CHAT_SESSIONS);
    return result[STORAGE_KEYS.CHAT_SESSIONS] || [];
  }

  // Get chat session by ID
  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const sessions = await this.getChatSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  }

  // Get or create chat session for a URL
  async getOrCreateSessionForUrl(url: string, title: string): Promise<ChatSession> {
    const sessions = await this.getChatSessions();
    const existing = sessions.find((s) => s.pageUrl === url);

    if (existing) {
      return existing;
    }

    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      pageUrl: url,
      pageTitle: title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.saveChatSession(newSession);
    return newSession;
  }

  // Save chat session
  async saveChatSession(session: ChatSession): Promise<void> {
    const sessions = await this.getChatSessions();
    const index = sessions.findIndex((s) => s.id === session.id);

    session.updatedAt = new Date().toISOString();

    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }

    // Limit stored sessions
    const settings = await this.getSettings();
    const limited = sessions.slice(0, settings.maxHistoryLength);

    await browser.storage.local.set({ [STORAGE_KEYS.CHAT_SESSIONS]: limited });
  }

  // Add message to session
  async addMessageToSession(sessionId: string, message: ChatMessage): Promise<ChatSession | null> {
    const session = await this.getChatSession(sessionId);
    if (!session) return null;

    session.messages.push(message);
    await this.saveChatSession(session);
    return session;
  }

  // Delete chat session
  async deleteChatSession(sessionId: string): Promise<void> {
    const sessions = await this.getChatSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    await browser.storage.local.set({ [STORAGE_KEYS.CHAT_SESSIONS]: filtered });
  }

  // Clear all chat sessions
  async clearChatSessions(): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEYS.CHAT_SESSIONS]: [] });
  }

  // Get current session ID
  async getCurrentSessionId(): Promise<string | null> {
    const result = await browser.storage.local.get(STORAGE_KEYS.CURRENT_SESSION);
    return result[STORAGE_KEYS.CURRENT_SESSION] || null;
  }

  // Set current session ID
  async setCurrentSessionId(sessionId: string | null): Promise<void> {
    if (sessionId) {
      await browser.storage.local.set({ [STORAGE_KEYS.CURRENT_SESSION]: sessionId });
    } else {
      await browser.storage.local.remove(STORAGE_KEYS.CURRENT_SESSION);
    }
  }

  // Export all data
  async exportData(): Promise<{
    settings: Settings;
    sessions: ChatSession[];
  }> {
    const settings = await this.getSettings();
    const sessions = await this.getChatSessions();
    return { settings, sessions };
  }

  // Import data
  async importData(data: {
    settings?: Partial<Settings>;
    sessions?: ChatSession[];
  }): Promise<void> {
    if (data.settings) {
      await this.updateSettings(data.settings);
    }
    if (data.sessions) {
      await browser.storage.local.set({ [STORAGE_KEYS.CHAT_SESSIONS]: data.sessions });
    }
  }

  // Get storage usage info
  async getStorageInfo(): Promise<{
    bytesUsed: number;
    quota: number;
  }> {
    if (browser.storage.local.getBytesInUse) {
      const bytesUsed = await browser.storage.local.getBytesInUse(null);
      return { bytesUsed, quota: 10 * 1024 * 1024 }; // 10MB default quota
    }
    return { bytesUsed: 0, quota: 10 * 1024 * 1024 };
  }
}
