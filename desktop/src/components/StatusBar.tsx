import { Circle, Globe, FileText, ShoppingBag, Search, HelpCircle } from 'lucide-react';
import type { PageType } from '@/types';

interface StatusBarProps {
  backendStatus: 'online' | 'offline' | 'checking';
  currentUrl?: string;
  pageType?: PageType;
}

export function StatusBar({ backendStatus, currentUrl, pageType }: StatusBarProps) {
  const getPageTypeIcon = () => {
    switch (pageType) {
      case 'product':
        return <ShoppingBag className="w-3 h-3" />;
      case 'article':
        return <FileText className="w-3 h-3" />;
      case 'search':
        return <Search className="w-3 h-3" />;
      default:
        return <HelpCircle className="w-3 h-3" />;
    }
  };

  return (
    <footer className="h-7 px-4 flex items-center justify-between text-xs bg-gray-100 dark:bg-slate-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        {/* Backend status */}
        <div className="flex items-center gap-1.5">
          <Circle
            className={`w-2 h-2 fill-current ${
              backendStatus === 'online'
                ? 'text-green-500'
                : backendStatus === 'offline'
                  ? 'text-red-500'
                  : 'text-yellow-500'
            }`}
          />
          <span className="text-gray-600 dark:text-gray-400">
            Backend {backendStatus === 'checking' ? 'Checking...' : backendStatus}
          </span>
        </div>

        {/* Current URL */}
        {currentUrl && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Globe className="w-3 h-3" />
            <span className="truncate max-w-xs">{new URL(currentUrl).hostname}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Page type */}
        {pageType && (
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            {getPageTypeIcon()}
            <span className="capitalize">{pageType}</span>
          </div>
        )}
      </div>
    </footer>
  );
}
