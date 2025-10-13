'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConditionalLayout } from '@/components/ConditionalLayout';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <Toaster />
      </AuthProvider>
    </SessionProvider>
  );
}

