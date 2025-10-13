'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { AppNavbar } from '@/components/AppNavbar';
import { SpinnerWithText } from '@/components/ui/spinner';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <AppSidebar />
      <AppNavbar />
      <div style={{
        flex: 1,
        marginLeft: collapsed ? '80px' : '250px', // Ajuste dinámico
        paddingTop: '64px', // Espacio para la navbar
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        transition: 'margin-left 0.3s ease'
      }}>
        {children}
      </div>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    // Si no está en la página de login y no hay sesión, redirigir al login
    if (!isLoginPage && status === 'unauthenticated') {
      router.push('/login');
    }
    
    // Si está en la página de login y ya tiene sesión, redirigir al dashboard
    if (isLoginPage && status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [session, status, isLoginPage, router, hasMounted]);

  // Evitar hidratación mismatch - no renderizar nada hasta que monte
  if (!hasMounted) {
    return null;
  }

  // Mostrar loading mientras se verifica la sesión
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="bg-white p-10 rounded-xl shadow-lg text-center max-w-sm">
          <SpinnerWithText size="lg" text="Cargando aplicación..." />
        </div>
      </div>
    );
  }

  // Si no está autenticado y no está en login, no mostrar nada (se redirigirá)
  if (!isLoginPage && !session) {
    return null;
  }

  return <>{children}</>;
}

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <AuthGuard>
      {isLoginPage ? (
        <>{children}</>
      ) : (
        <SidebarProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
        </SidebarProvider>
      )}
    </AuthGuard>
  );
}
