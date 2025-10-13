// Tipos para el sistema de autenticación
export interface AuthUser {
  id: string;
  name: string;
  role: AuthRole;
  isActive: boolean;
}

export interface AuthRole {
  id: string;
  name: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Roles del sistema
export const ROLES = {
  ADMIN: 'admin',
  ESPECIALISTA: 'especialista',
  RECEPCION: 'recepcion',
  CAJA: 'caja'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

