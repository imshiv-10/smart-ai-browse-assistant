import { useState } from 'react';
import { GitCompare, Loader2, ExternalLink, Star, Package } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { compareProducts } from '@/lib/api';
import type { ComparisonResponse, ProductAlternative } from '@/types';

export function ComparePanel() {
  const { currentPage, settings } = useAppStore();
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!currentPage) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await compareProducts(currentPage.url, currentPage, settings.backendUrl);
      setComparison(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare products');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentPage) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <GitCompare className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-medium mb-2">No Product Page</h2>
        <p className="text-sm">Navigate to a product page to compare alternatives</p>
      </div>
    );
  }

  if (currentPage.page_type !== 'product') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-medium mb-2">Not a Product Page</h2>
        <p className="text-sm text-center max-w-md">
          The current page doesn't appear to be a product page. Navigate to a product page to compare
          alternatives.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Current product */}
      {currentPage.product && (
        <div className="card p-6">
          <div className="flex items-start gap-4">
            {currentPage.product.images?.[0] && (
              <img
                src={currentPage.product.images[0]}
                alt={currentPage.product.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentPage.product.name}
              </h2>
              <div className="flex items-center gap-4 mt-2">
                {currentPage.product.price && (
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {currentPage.product.currency}
                    {currentPage.product.price.toFixed(2)}
                  </span>
                )}
                {currentPage.product.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentPage.product.rating.toFixed(1)}
                      {currentPage.product.reviewCount && (
                        <span className="ml-1">({currentPage.product.reviewCount} reviews)</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
              {currentPage.product.brand && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Brand: {currentPage.product.brand}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare button */}
      {!comparison && !isLoading && (
        <div className="card p-8 text-center">
          <GitCompare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Find Alternatives
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Discover similar products and compare prices across different sources
          </p>
          <button onClick={handleCompare} className="btn-primary">
            Compare Products
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="card p-8 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Searching for alternatives...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="card p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={handleCompare} className="mt-4 btn-primary">
            Try Again
          </button>
        </div>
      )}

      {/* Comparison results */}
      {comparison && (
        <>
          {/* Verdict */}
          <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">AI Verdict</h3>
            <p className="text-blue-800 dark:text-blue-200 selectable">{comparison.verdict}</p>
          </div>

          {/* Alternatives */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Alternatives ({comparison.alternatives.length})
            </h3>
            <div className="space-y-4">
              {comparison.alternatives.map((alt, index) => (
                <AlternativeCard key={index} alternative={alt} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AlternativeCard({ alternative }: { alternative: ProductAlternative }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
      {alternative.image && (
        <img
          src={alternative.image}
          alt={alternative.name}
          className="w-16 h-16 object-cover rounded-lg"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">{alternative.name}</h4>
        <div className="flex items-center gap-3 mt-1">
          {alternative.price && (
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
              {alternative.currency}
              {alternative.price.toFixed(2)}
            </span>
          )}
          {alternative.rating && (
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {alternative.rating.toFixed(1)}
            </div>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">{alternative.source}</span>
        </div>
      </div>
      <a
        href={alternative.url}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <ExternalLink className="w-5 h-5 text-gray-500" />
      </a>
    </div>
  );
}
