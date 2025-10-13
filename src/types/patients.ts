// Tipos para Pacientes
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  identityNumber: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
  medicalHistory?: string;
  allergies?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: string;
  identityNumber: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
  medicalHistory?: string;
  allergies?: string;
}

export interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  birthDate?: Date;
  gender?: string;
  identityNumber?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  emergencyContactRelation?: string;
  medicalHistory?: string;
  allergies?: string;
}

// Props para el modal de pacientes
export interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
  onSave: (data: CreatePatientData | UpdatePatientData) => Promise<void>;
  isLoading?: boolean;
}

// Interface para información de paginación
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  limit: number;
}
