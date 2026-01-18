import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Settings, PageContent, ChatMessage, SummaryResponse } from '@/types';

interface AppState {
  // Settings
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;

  // Current page content
  currentPage: PageContent | null;
  setCurrentPage: (page: PageContent | null) => void;

  // Chat history
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;

  // Summary
  currentSummary: SummaryResponse | null;
  setCurrentSummary: (summary: SummaryResponse | null) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // URL history
  urlHistory: string[];
  addToUrlHistory: (url: string) => void;
  clearUrlHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Settings
      settings: {
        backendUrl: 'http://localhost:8000',
        localLlmUrl: 'http://localhost:1234',
        theme: 'system',
        autoSummarize: true,
        language: 'en',
      },
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Current page
      currentPage: null,
      setCurrentPage: (page) => set({ currentPage: page }),

      // Chat
      chatMessages: [],
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),
      clearChatMessages: () => set({ chatMessages: [] }),

      // Summary
      currentSummary: null,
      setCurrentSummary: (summary) => set({ currentSummary: summary }),

      // Loading
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),

      // URL history
      urlHistory: [],
      addToUrlHistory: (url) =>
        set((state) => ({
          urlHistory: [url, ...state.urlHistory.filter((u) => u !== url)].slice(0, 20),
        })),
      clearUrlHistory: () => set({ urlHistory: [] }),
    }),
    {
      name: 'smart-browse-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        urlHistory: state.urlHistory,
      }),
    }
  )
);
