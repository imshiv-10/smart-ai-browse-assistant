import { useState, useEffect } from 'react';
import { UrlInput } from './components/UrlInput';
import { Sidebar } from './components/Sidebar';
import { SummaryPanel } from './components/SummaryPanel';
import { ChatPanel } from './components/ChatPanel';
import { ComparePanel } from './components/ComparePanel';
import { SettingsPanel } from './components/SettingsPanel';
import { StatusBar } from './components/StatusBar';
import { useAppStore } from './lib/store';
import { fetchUrlContent, summarizeContent, checkBackendHealth } from './lib/api';

type View = 'summary' | 'chat' | 'compare' | 'settings';

export default function App() {
  const [activeView, setActiveView] = useState<View>('summary');
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { settings, currentPage, setCurrentPage, setCurrentSummary, setIsLoading, isLoading } = useAppStore();

  // Check theme preference
  useEffect(() => {
    const updateTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [settings.theme]);

  // Check backend health
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await checkBackendHealth(settings.backendUrl);
        setBackendStatus('online');
      } catch {
        setBackendStatus('offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, [settings.backendUrl]);

  const handleUrlSubmit = async (url: string) => {
    setIsLoading(true);
    try {
      const content = await fetchUrlContent(url);
      setCurrentPage(content);

      // Auto-summarize if enabled
      if (settings.autoSummarize) {
        const summary = await summarizeContent(content, settings.backendUrl);
        setCurrentSummary(summary);
      }
    } catch (error) {
      console.error('Failed to fetch URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* URL Input */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
          <UrlInput onSubmit={handleUrlSubmit} isLoading={isLoading} />
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto p-6">
          {activeView === 'summary' && <SummaryPanel />}
          {activeView === 'chat' && <ChatPanel />}
          {activeView === 'compare' && <ComparePanel />}
          {activeView === 'settings' && <SettingsPanel />}
        </div>

        {/* Status bar */}
        <StatusBar
          backendStatus={backendStatus}
          currentUrl={currentPage?.url}
          pageType={currentPage?.page_type}
        />
      </main>
    </div>
  );
}
