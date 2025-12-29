'use client';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-slate-600 border-t-purple-500',
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-slate-400">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = 'Processing...' }: LoadingPageProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-white font-medium">{message}</p>
    </div>
  );
}

