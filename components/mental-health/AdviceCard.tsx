// components/mental-health/AdviceCard.tsx
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Icons } from '../ui/icons';

type Advice = {
  id: string;
  title: string;
  content: string;
  category: 'mental' | 'physical' | 'nutrition' | 'sleep' | 'stress';
  isFavorite: boolean;
  lastViewed?: Date;
};

interface AdviceCardProps {
  advice: Advice;
  onFavoriteToggle?: (id: string, isFavorite: boolean) => Promise<void>;
  onView?: (id: string) => void;
  className?: string;
}

const categoryStyles = {
  mental: 'bg-indigo-50 text-indigo-800 border-indigo-100',
  physical: 'bg-emerald-50 text-emerald-800 border-emerald-100',
  nutrition: 'bg-amber-50 text-amber-800 border-amber-100',
  sleep: 'bg-blue-50 text-blue-800 border-blue-100',
  stress: 'bg-rose-50 text-rose-800 border-rose-100',
};

const categoryIcons = {
  mental: 'Brain',
  physical: 'Activity',
  nutrition: 'Apple',
  sleep: 'Moon',
  stress: 'AlertTriangle',
} as const;

const AdviceCard: React.FC<AdviceCardProps> = ({
  advice,
  onFavoriteToggle,
  onView,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFav, setIsFav] = useState(advice.isFavorite);

  const Icon = Icons[categoryIcons[advice.category]];

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (onFavoriteToggle) {
        await onFavoriteToggle(advice.id, !isFav);
      }
      setIsFav(!isFav);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(advice.id);
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all cursor-pointer hover:shadow-md',
        className
      )}
      onClick={handleView}
    >
      <div className={cn('p-4 border-b', categoryStyles[advice.category])}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">
              {advice.category}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleFavoriteToggle}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icons.Spinner className="h-3 w-3 animate-spin" />
            ) : isFav ? (
              <Icons.Heart className="h-3 w-3 fill-current text-rose-500" />
            ) : (
              <Icons.Heart className="h-3 w-3" />
            )}
          </Button>
        </div>
        <h3 className="font-semibold mt-2">{advice.title}</h3>
      </div>

      <div className="bg-white p-4">
        <div className="flex justify-between items-start">
          <p className={cn('text-sm', !isExpanded && 'line-clamp-2')}>
            {advice.content}
          </p>
          <Icons.ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 ml-2 transition-transform',
              isExpanded && 'rotate-180'
            )}
          />
        </div>

        {isExpanded && (
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Implement share functionality
              }}
            >
              <Icons.Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Implement action functionality
              }}
            >
              Take Action
            </Button>
          </div>
        )}

        {advice.lastViewed && (
          <div className="mt-2 text-xs text-gray-500 text-right">
            Last viewed: {new Date(advice.lastViewed).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdviceCard;