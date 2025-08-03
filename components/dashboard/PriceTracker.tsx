// components/dashboard/PriceTracker.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Equal, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PriceTrackerProps {
  productName: string;
  currentPrice: number;
  originalPrice: number;
  currency?: string;
  priceHistory?: {
    date: string;
    price: number;
  }[];
  lastUpdated: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  targetPrice?: number;
  storeName?: string;
  productUrl?: string;
}

export const PriceTracker = React.forwardRef<HTMLDivElement, PriceTrackerProps>(
  (
    {
      productName,
      currentPrice,
      originalPrice,
      currency = 'USD',
      priceHistory = [],
      lastUpdated,
      isLoading = false,
      onRefresh,
      className,
      targetPrice,
      storeName,
      productUrl,
    },
    ref
  ) => {
    const priceChange = ((currentPrice - originalPrice) / originalPrice) * 100;
    const absoluteChange = Math.abs(priceChange);
    const formattedChange = `${absoluteChange.toFixed(2)}%`;

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(price);
    };

    const getPriceTrend = () => {
      if (priceChange > 0) {
        return {
          icon: <TrendingUp className="h-5 w-5 text-red-500" />,
          text: 'ارتفاع',
          variant: 'negative',
        };
      } else if (priceChange < 0) {
        return {
          icon: <TrendingDown className="h-5 w-5 text-green-500" />,
          text: 'انخفاض',
          variant: 'positive',
        };
      } else {
        return {
          icon: <Equal className="h-5 w-5 text-gray-500" />,
          text: 'ثبات',
          variant: 'neutral',
        };
      }
    };

    const trend = getPriceTrend();

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{productName}</h3>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn(
                    'h-4 w-4',
                    isLoading ? 'animate-spin' : ''
                  )}
                />
              </Button>
            )}
          </div>
        </div>

        {storeName && (
          <p className="text-sm text-muted-foreground mt-1">{storeName}</p>
        )}

        {isLoading ? (
          <div className="mt-4 space-y-3">
            <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">{formatPrice(currentPrice)}</p>
                {originalPrice !== currentPrice && (
                  <p className="text-sm text-muted-foreground line-through">
                    {formatPrice(originalPrice)}
                  </p>
                )}
              </div>
              <div className="flex items-center">
                {trend.icon}
                <span
                  className={cn(
                    'ml-2 text-sm font-medium',
                    trend.variant === 'positive' && 'text-green-600 dark:text-green-400',
                    trend.variant === 'negative' && 'text-red-600 dark:text-red-400',
                    trend.variant === 'neutral' && 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {trend.text} {formattedChange}
                </span>
              </div>
            </div>

            {targetPrice && (
              <div className="mt-3 flex items-center text-sm">
                <span className="text-muted-foreground">
                  السعر المستهدف: {formatPrice(targetPrice)}
                </span>
                <ArrowRight className="mx-2 h-4 w-4" />
                <span
                  className={cn(
                    'font-medium',
                    currentPrice <= targetPrice
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {currentPrice <= targetPrice ? 'تحقق' : 'لم يتحقق بعد'}
                </span>
              </div>
            )}

            {priceHistory.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>سجل الأسعار:</span>
                  <span>آخر تحديث: {new Date(lastUpdated).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 flex overflow-x-auto pb-2">
                  {priceHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="mr-3 flex shrink-0 flex-col items-center"
                    >
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium',
                          entry.price < originalPrice
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        )}
                      >
                        {formatPrice(entry.price).replace(/\D/g, '')}
                      </div>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productUrl && (
              <div className="mt-4">
                <a
                  href={productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  عرض المنتج في المتجر
                </a>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

PriceTracker.displayName = 'PriceTracker';

export { PriceTracker };