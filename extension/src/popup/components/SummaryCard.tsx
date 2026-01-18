import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import type { PageContent, SummaryResponse } from '@/shared/types';

interface SummaryCardProps {
  pageContent: PageContent | null;
  isPageLoading: boolean;
  onStartChat: (message?: string) => void;
  onCompare: () => void;
}

export function SummaryCard({ pageContent, isPageLoading, onStartChat, onCompare }: SummaryCardProps) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    if (!pageContent) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await browser.runtime.sendMessage({
        type: 'SUMMARIZE',
        payload: pageContent,
      });
      setSummary(response as SummaryResponse);
    } catch (err) {
      console.error('Summary error:', err);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate summary when page content loads
  useEffect(() => {
    if (pageContent && !summary && !isLoading && !error) {
      generateSummary();
    }
  }, [pageContent]);

  // Loading state
  if (isPageLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-gray-900 dark:text-white">Analyzing page...</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Reading content</p>
        </div>
      </div>
    );
  }

  // No content state
  if (!pageContent) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-[15px] font-medium text-gray-900 dark:text-white">No content available</p>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">Navigate to a webpage to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Summary loading state */}
      {isLoading && (
        <div className="p-5">
          <div className="card p-5 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <div className="flex gap-1">
                  <div className="loading-dot w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="loading-dot w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="loading-dot w-2 h-2 bg-blue-500 rounded-full" />
                </div>
              </div>
              <div>
                <p className="text-[15px] font-medium text-gray-900 dark:text-white">Generating summary...</p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">AI is analyzing the page</p>
              </div>
            </div>
            {/* Skeleton loading */}
            <div className="space-y-3">
              <div className="skeleton h-4 rounded-full w-full" />
              <div className="skeleton h-4 rounded-full w-5/6" />
              <div className="skeleton h-4 rounded-full w-4/6" />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-5">
          <div className="card p-5 border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-red-700 dark:text-red-400">{error}</p>
                <button
                  onClick={generateSummary}
                  className="mt-3 text-[13px] font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary content */}
      {summary && !isLoading && (
        <div className="p-5 space-y-4 animate-fade-in-up">
          {/* Main summary card */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Summary</h2>
            </div>
            <p className="text-[15px] leading-relaxed text-gray-800 dark:text-gray-200">
              {summary.summary}
            </p>

            {/* Sentiment badge */}
            {summary.sentiment && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className={`badge ${
                  summary.sentiment === 'positive' ? 'badge-success' :
                  summary.sentiment === 'negative' ? 'badge-error' : 'badge-warning'
                }`}>
                  {summary.sentiment === 'positive' ? '😊 Positive' :
                   summary.sentiment === 'negative' ? '😟 Negative' : '😐 Neutral'}
                </span>
              </div>
            )}
          </div>

          {/* Key points */}
          {summary.keyPoints && summary.keyPoints.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Key Points</h2>
              </div>
              <div className="space-y-0">
                {summary.keyPoints.map((point, index) => (
                  <div key={index} className="key-point">
                    <div className="key-point-icon">
                      <span className="text-[11px] text-white font-semibold">{index + 1}</span>
                    </div>
                    <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {summary.topics && summary.topics.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Topics</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.topics.map((topic, index) => (
                  <span key={index} className="topic-pill">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onStartChat()}
              className="card p-4 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Ask Questions</span>
            </button>

            {pageContent?.pageType === 'product' && (
              <button
                onClick={onCompare}
                className="card p-4 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Compare</span>
              </button>
            )}

            {pageContent?.pageType !== 'product' && (
              <button
                onClick={() => onStartChat('What are the main takeaways from this page?')}
                className="card p-4 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Deep Dive</span>
              </button>
            )}
          </div>

          {/* Regenerate button */}
          <button
            onClick={generateSummary}
            className="w-full text-center text-[13px] text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 py-2 transition-colors"
          >
            Regenerate summary
          </button>
        </div>
      )}
    </div>
  );
}
