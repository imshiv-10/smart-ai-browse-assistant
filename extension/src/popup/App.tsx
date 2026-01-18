import { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { SummaryCard } from './components/SummaryCard';
import { ProductComparison } from './components/ProductComparison';
import { Settings } from './components/Settings';
import { usePageContent } from './hooks/usePageContent';
import { useChat } from './hooks/useChat';
import type { Settings as SettingsType } from '@/shared/types';
import browser from 'webextension-polyfill';

type View = 'home' | 'chat' | 'compare' | 'settings';

export default function App() {
  const [activeView, setActiveView] = useState<View>('home');
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [isDark, setIsDark] = useState(false);

  const { pageContent, isLoading: isPageLoading, error: pageError, refresh } = usePageContent();
  const chat = useChat(pageContent);

  // Load settings and theme
  useEffect(() => {
    const loadSettings = async () => {
      const response = await browser.runtime.sendMessage({ type: 'GET_SETTINGS' });
      setSettings(response);

      if (response.theme === 'dark' ||
          (response.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDark(true);
        document.body.classList.add('dark');
      }
    };
    loadSettings();
  }, []);

  const handleSettingsUpdate = async (newSettings: Partial<SettingsType>) => {
    const response = await browser.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      payload: newSettings,
    });
    setSettings(response);

    if (newSettings.theme) {
      const shouldBeDark = newSettings.theme === 'dark' ||
        (newSettings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(shouldBeDark);
      document.body.classList.toggle('dark', shouldBeDark);
    }
  };

  const startChat = (initialMessage?: string) => {
    setActiveView('chat');
    if (initialMessage) {
      chat.sendMessage(initialMessage);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'dark' : ''}`}>
      {/* Header with glassmorphism */}
      <header className="glass sticky top-0 z-10 px-5 py-4 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeView !== 'home' && (
              <button
                onClick={() => setActiveView('home')}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="font-semibold text-[15px] tracking-tight">
                  {activeView === 'home' ? 'Smart Browse' :
                   activeView === 'chat' ? 'Chat' :
                   activeView === 'compare' ? 'Compare' : 'Settings'}
                </h1>
                {pageContent && activeView === 'home' && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                    {pageContent.title}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={isPageLoading}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <svg
                className={`w-4.5 h-4.5 text-gray-500 ${isPageLoading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <svg className="w-4.5 h-4.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {pageError && (
        <div className="px-5 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/30">
          <p className="text-[13px] text-red-600 dark:text-red-400">{pageError}</p>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {activeView === 'home' && (
          <SummaryCard
            pageContent={pageContent}
            isPageLoading={isPageLoading}
            onStartChat={startChat}
            onCompare={() => setActiveView('compare')}
          />
        )}
        {activeView === 'chat' && (
          <ChatWindow
            messages={chat.messages}
            isLoading={chat.isLoading}
            onSendMessage={chat.sendMessage}
            pageContent={pageContent}
          />
        )}
        {activeView === 'compare' && (
          <ProductComparison pageContent={pageContent} />
        )}
        {activeView === 'settings' && settings && (
          <Settings settings={settings} onUpdate={handleSettingsUpdate} />
        )}
      </main>
    </div>
  );
}
