import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-4 border-gray-200 border-t-blue-600',
        {
          'h-6 w-6': size === 'sm',
          'h-10 w-10': size === 'md',
          'h-16 w-16': size === 'lg',
        },
        className
      )}
    />
  );
}