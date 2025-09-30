'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConditionalLayout } from '@/components/ConditionalLayout';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </AuthProvider>
    </SessionProvider>
  );
}

