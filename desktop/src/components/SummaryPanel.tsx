import { FileText, Loader2, RefreshCw, Copy, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { summarizeContent } from '@/lib/api';

export function SummaryPanel() {
  const { currentPage, currentSummary, setCurrentSummary, settings, isLoading, setIsLoading } = useAppStore();
  const [copied, setCopied] = useState(false);

  const handleRefresh = async () => {
    if (!currentPage) return;
    setIsLoading(true);
    try {
      const summary = await summarizeContent(currentPage, settings.backendUrl);
      setCurrentSummary(summary);
    } catch (error) {
      console.error('Failed to summarize:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (currentSummary) {
      const text = `${currentSummary.summary}\n\nKey Points:\n${currentSummary.key_points.map((p) => `• ${p}`).join('\n')}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!currentPage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-medium mb-2">No Page Analyzed</h2>
        <p className="text-sm">Enter a URL above to get started</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page info header */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
              {currentPage.title}
            </h2>
            <a
              href={currentPage.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline truncate block mt-1"
            >
              {currentPage.url}
            </a>
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 capitalize">
                {currentPage.page_type}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Analyzed {new Date(currentPage.extracted_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Refresh summary"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Copy summary"
            >
              {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Summary content */}
      {isLoading ? (
        <div className="card p-8 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Generating summary...</p>
        </div>
      ) : currentSummary ? (
        <>
          {/* Summary */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Summary</h3>
              {currentSummary.sentiment && (
                <span
                  className={`ml-auto px-2 py-1 text-xs font-medium rounded-full ${
                    currentSummary.sentiment === 'positive'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      : currentSummary.sentiment === 'negative'
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {currentSummary.sentiment}
                </span>
              )}
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed selectable">
              {currentSummary.summary}
            </p>
          </div>

          {/* Key Points */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Key Points</h3>
            <ul className="space-y-3">
              {currentSummary.key_points.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 selectable">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Topics */}
          {currentSummary.topics && currentSummary.topics.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {currentSummary.topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready to Summarize</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Click the button below to generate an AI summary
          </p>
          <button onClick={handleRefresh} className="btn-primary">
            Generate Summary
          </button>
        </div>
      )}
    </div>
  );
}
