// components/dashboard/MetricsCard.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Equal } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'positive' | 'negative' | 'neutral';
  className?: string;
  description?: string;
  isLoading?: boolean;
  currency?: string;
  compact?: boolean;
}

const MetricsCard = React.forwardRef<HTMLDivElement, MetricsCardProps>(
  (
    {
      title,
      value,
      change,
      icon,
      variant = 'default',
      className,
      description,
      isLoading = false,
      currency,
      compact = false,
    },
    ref
  ) => {
    const getVariantStyles = () => {
      switch (variant) {
        case 'positive':
          return 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        case 'negative':
          return 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        case 'neutral':
          return 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
        default:
          return 'bg-gray-50 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      }
    };

    const renderChangeIndicator = () => {
      if (change === undefined || change === null) return null;

      const absoluteChange = Math.abs(change);
      const formattedChange = `${absoluteChange}%`;

      if (change > 0) {
        return (
          <span className={`flex items-center ${variant === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            <ArrowUp className="h-4 w-4 mr-1" />
            {formattedChange}
          </span>
        );
      } else if (change < 0) {
        return (
          <span className={`flex items-center ${variant === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <ArrowDown className="h-4 w-4 mr-1" />
            {formattedChange}
          </span>
        );
      } else {
        return (
          <span className="flex items-center text-gray-600 dark:text-gray-400">
            <Equal className="h-4 w-4 mr-1" />
            {formattedChange}
          </span>
        );
      }
    };

    const renderTrendIcon = () => {
      if (change === undefined || change === null) return null;

      if (change > 0) {
        return <TrendingUp className="h-5 w-5 ml-2 text-green-500" />;
      } else if (change < 0) {
        return <TrendingDown className="h-5 w-5 ml-2 text-red-500" />;
      } else {
        return <Equal className="h-5 w-5 ml-2 text-gray-500" />;
      }
    };

    const formatValue = () => {
      if (typeof value === 'number') {
        if (currency) {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }).format(value);
        }
        return value.toLocaleString();
      }
      return value;
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl border p-6 shadow-sm transition-all hover:shadow-md',
          getVariantStyles(),
          compact ? 'p-4' : 'p-6',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{title}</h3>
          {icon && <div className="h-5 w-5">{icon}</div>}
        </div>

        {isLoading ? (
          <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        ) : (
          <>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-2xl font-semibold tracking-tight">
                {formatValue()}
              </p>
              {renderTrendIcon()}
            </div>

            {(change !== undefined || description) && (
              <div className="mt-2 flex items-center justify-between text-xs">
                {change !== undefined && renderChangeIndicator()}
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }
);

MetricsCard.displayName = 'MetricsCard';

export { MetricsCard };