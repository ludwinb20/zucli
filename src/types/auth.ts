// Tipos para el sistema de autenticación
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
}

export interface AuthState {
  user: User | null;
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

// Datos dummy para demostración
export const DUMMY_USERS: User[] = [
  {
    id: '1',
    email: 'admin@clinica.com',
    name: 'Dr. Administrador',
    role: { id: '1', name: ROLES.ADMIN },
    isActive: true
  },
  {
    id: '2',
    email: 'especialista@clinica.com',
    name: 'Dr. Juan Pérez',
    role: { id: '2', name: ROLES.ESPECIALISTA },
    isActive: true
  },
  {
    id: '3',
    email: 'recepcion@clinica.com',
    name: 'María González',
    role: { id: '3', name: ROLES.RECEPCION },
    isActive: true
  },
  {
    id: '4',
    email: 'caja@clinica.com',
    name: 'Carlos López',
    role: { id: '4', name: ROLES.CAJA },
    isActive: true
  }
];
