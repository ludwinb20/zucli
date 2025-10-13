'use client';

import { cn } from '@/lib/utils';
import { SpinnerProps, SpinnerWithTextProps } from '@/types/ui';

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <svg
      className={cn(
        'animate-spin text-[#2E9589]',
        sizeClasses[size],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Spinner con texto opcional
export function SpinnerWithText({ 
  size = 'md', 
  text = 'Cargando...', 
  className,
  textClassName 
}: SpinnerWithTextProps) {
  return (
    <div className="flex items-center justify-center flex-col gap-3">
      <Spinner size={size} className={className} />
      {text && (
        <span className={cn('text-gray-600 text-sm font-medium', textClassName)}>
          {text}
        </span>
      )}
    </div>
  );
}

// Spinner inline (para botones)
export function InlineSpinner({ size = 'sm', className }: SpinnerProps) {
  return (
    <Spinner size={size} className={className} />
  );
}
