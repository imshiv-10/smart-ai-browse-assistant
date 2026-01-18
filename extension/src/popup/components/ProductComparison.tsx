import { useState } from 'react';
import browser from 'webextension-polyfill';
import type { PageContent, ComparisonResponse } from '@/shared/types';

interface ProductComparisonProps {
  pageContent: PageContent | null;
}

export function ProductComparison({ pageContent }: ProductComparisonProps) {
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runComparison = async () => {
    if (!pageContent) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await browser.runtime.sendMessage({
        type: 'COMPARE_PRODUCT',
        payload: {
          url: pageContent.url,
          content: pageContent,
        },
      });
      setComparison(response as ComparisonResponse);
    } catch (err) {
      console.error('Comparison error:', err);
      setError('Failed to compare products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Not a product page
  if (pageContent && pageContent.pageType !== 'product') {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚖️</span>
          </div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            Not a Product Page
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Product comparison works best on product pages.
            <br />
            Try visiting a product on Amazon, eBay, or similar sites.
          </p>
        </div>
      </div>
    );
  }

  if (!pageContent) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚖️</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading page content...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Current product info */}
      {pageContent.product && (
        <div className="card p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Current Product
          </h3>
          <div className="flex gap-3">
            {pageContent.product.images[0] && (
              <img
                src={pageContent.product.images[0]}
                alt={pageContent.product.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                {pageContent.product.name}
              </h4>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-1">
                {pageContent.product.currency} {pageContent.product.price?.toFixed(2)}
              </p>
              {pageContent.product.rating && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ⭐ {pageContent.product.rating}/5
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare button */}
      {!comparison && !isLoading && (
        <button
          onClick={runComparison}
          className="btn btn-primary w-full"
        >
          Find Alternatives & Compare
        </button>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="card p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Searching for alternatives...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This may take a moment
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={runComparison}
            className="btn btn-secondary mt-2 text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Comparison results */}
      {comparison && (
        <div className="space-y-4">
          {/* Verdict */}
          <div className="card p-4 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
            <h3 className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-2">
              Verdict
            </h3>
            <p className="text-sm text-primary-700 dark:text-primary-300">
              {comparison.verdict}
            </p>
          </div>

          {/* Current product pros/cons */}
          <div className="card p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Current Product Analysis
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                  Pros
                </h4>
                <ul className="space-y-1">
                  {comparison.prosConsAnalysis.current.pros.map((pro, i) => (
                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                      <span className="text-green-500">+</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                  Cons
                </h4>
                <ul className="space-y-1">
                  {comparison.prosConsAnalysis.current.cons.map((con, i) => (
                    <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                      <span className="text-red-500">-</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Alternatives */}
          <div className="card p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Alternatives ({comparison.alternatives.length})
            </h3>
            <div className="space-y-3">
              {comparison.alternatives.map((alt, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  {alt.image && (
                    <img
                      src={alt.image}
                      alt={alt.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {alt.name}
                    </h4>
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      {alt.currency} {alt.price?.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {alt.rating && (
                        <span className="text-xs text-gray-500">⭐ {alt.rating}</span>
                      )}
                      <span className="text-xs text-gray-400">{alt.source}</span>
                    </div>
                  </div>
                  <a
                    href={alt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-500 hover:text-primary-600 self-center"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          {comparison.recommendation && (
            <div className="card p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                Recommendation
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                {comparison.recommendation}
              </p>
            </div>
          )}

          <button
            onClick={runComparison}
            className="btn btn-secondary w-full text-sm"
          >
            Search Again
          </button>
        </div>
      )}
    </div>
  );
}
