import { useState, useEffect, useCallback } from 'react';
import browser from 'webextension-polyfill';
import type { PageContent } from '@/shared/types';

interface UsePageContentReturn {
  pageContent: PageContent | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePageContent(): UsePageContentReturn {
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const content = await browser.runtime.sendMessage({ type: 'GET_PAGE_CONTENT' });
      if (content) {
        setPageContent(content as PageContent);
      } else {
        setError('Could not extract page content. Please refresh the page.');
      }
    } catch (err) {
      console.error('Error fetching page content:', err);
      setError('Failed to connect to the page. Please refresh and try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    pageContent,
    isLoading,
    error,
    refresh: fetchContent,
  };
}
