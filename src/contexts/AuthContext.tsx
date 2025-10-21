'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthContextType, AuthUser } from '@/types/contexts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';

  const user: AuthUser | null = session?.user ? {
    id: session.user.id,
    username: session.user.username,
    name: session.user.name,
    role: session.user.role,
    specialty: session.user.specialty,
  } : null;

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      return result?.ok === true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: false 
    });
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
