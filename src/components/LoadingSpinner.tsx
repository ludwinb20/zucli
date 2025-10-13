'use client';

import { SpinnerWithText } from '@/components/ui/spinner';

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-sm">
        <SpinnerWithText 
          size="md" 
          text="Cargando..." 
          className="mb-2"
          textClassName="text-base"
        />
      </div>
    </div>
  );
}
