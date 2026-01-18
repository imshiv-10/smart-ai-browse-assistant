import { useState, useCallback, useEffect } from 'react';
import browser from 'webextension-polyfill';
import type { ChatMessage, PageContent } from '@/shared/types';
import { StorageManager } from '@/shared/storage';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const storage = new StorageManager();

export function useChat(pageContent: PageContent | null): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Load or create session when page content changes
  useEffect(() => {
    const initSession = async () => {
      if (!pageContent) return;

      try {
        const session = await storage.getOrCreateSessionForUrl(
          pageContent.url,
          pageContent.title
        );
        setSessionId(session.id);
        setMessages(session.messages);
        await storage.setCurrentSessionId(session.id);
      } catch (err) {
        console.error('Failed to initialize chat session:', err);
      }
    };

    initSession();
  }, [pageContent?.url]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !pageContent) return;

    setIsLoading(true);
    setError(null);

    // Create user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);

    // Save user message to storage
    if (sessionId) {
      await storage.addMessageToSession(sessionId, userMessage);
    }

    try {
      // Send to background script for processing
      const response = await browser.runtime.sendMessage({
        type: 'CHAT',
        payload: {
          messages: [...messages, userMessage],
          context: pageContent,
        },
      });

      const assistantMessage = response as ChatMessage;

      // Add assistant message to UI
      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to storage
      if (sessionId) {
        await storage.addMessageToSession(sessionId, assistantMessage);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get response. Please try again.');

      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, pageContent, sessionId]);

  const clearMessages = useCallback(async () => {
    setMessages([]);
    if (sessionId) {
      await storage.deleteChatSession(sessionId);
      // Create a new session
      if (pageContent) {
        const newSession = await storage.getOrCreateSessionForUrl(
          pageContent.url,
          pageContent.title
        );
        setSessionId(newSession.id);
      }
    }
  }, [sessionId, pageContent]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
