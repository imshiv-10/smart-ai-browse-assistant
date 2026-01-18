import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const { urlHistory, addToUrlHistory } = useAppStore();
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      addToUrlHistory(normalizedUrl);
      onSubmit(normalizedUrl);
      setShowHistory(false);
    }
  };

  const handleHistorySelect = (historyUrl: string) => {
    setUrl(historyUrl);
    onSubmit(historyUrl);
    setShowHistory(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder="Enter a URL to analyze..."
            className="input pl-10 pr-4"
            disabled={isLoading}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="btn-primary flex items-center gap-2 min-w-[120px] justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Analyze
            </>
          )}
        </button>
      </form>

      {/* URL History dropdown */}
      {showHistory && urlHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto z-10">
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
            Recent URLs
          </div>
          {urlHistory.map((historyUrl, index) => (
            <button
              key={index}
              onClick={() => handleHistorySelect(historyUrl)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
            >
              {historyUrl}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
