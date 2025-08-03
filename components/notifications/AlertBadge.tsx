// components/notifications/AlertBadge.tsx
import React from 'react';
import { cn } from '@/lib/utils';

type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertBadgeProps {
  variant: AlertVariant;
  count?: number;
  className?: string;
  children?: React.ReactNode;
}

const variantClasses = {
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
};

const AlertBadge: React.FC<AlertBadgeProps> = ({
  variant,
  count,
  className,
  children,
}) => {
  const baseClasses = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors';

  return (
    <span className={cn(
      baseClasses,
      variantClasses[variant],
      className
    )}>
      {children}
      {count !== undefined && count > 0 && (
        <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/80 text-xs font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </span>
  );
};

export default AlertBadge;