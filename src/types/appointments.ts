// Tipos para Especialidades Médicas
export interface Specialty {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  users?: Array<{
    id: string;
    name: string;
  }>;
}

export interface CreateSpecialtyData {
  name: string;
  description?: string;
}

export interface UpdateSpecialtyData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Estados de Citas
export type AppointmentStatus = 'programado' | 'pendiente' | 'completado' | 'cancelado';

// Tipos para Citas Médicas
export interface Appointment {
  id: string;
  patientId: string;
  specialtyId: string;
  appointmentDate: Date;
  status: AppointmentStatus;
  turnNumber?: number | null; // Número de turno (solo para citas pendientes)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relaciones
  patient: Patient;
  specialty: Specialty;
}

export interface CreateAppointmentData {
  patientId: string;
  specialtyId: string;
  appointmentDate: Date;
  status?: AppointmentStatus;
  notes?: string;
}

export interface UpdateAppointmentData {
  patientId?: string;
  specialtyId?: string;
  appointmentDate?: Date;
  status?: AppointmentStatus;
  notes?: string;
}

import { Patient } from './patients';

// Props para el modal de citas
export interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  onSave: (data: CreateAppointmentData | UpdateAppointmentData) => Promise<void>;
  specialties: Specialty[];
  isLoading?: boolean;
}

// Filtros para citas
export interface AppointmentFilters {
  status?: AppointmentStatus;
  specialtyId?: string;
  patientId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}
