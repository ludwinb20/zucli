// Tipos para gestión de usuarios
export interface User {
  id: string;
  username: string;
  name: string;
  isActive: boolean;
  role: UserRole;
  specialty?: UserSpecialty; // Especialidad asignada (opcional)
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  name: string;
}

export interface UserSpecialty {
  id: string;
  name: string;
}

// Props para modales de usuario
export interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
}

export interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}
