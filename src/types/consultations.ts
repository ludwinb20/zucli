// Re-exportar tipos de transacciones
import type { 
  TransactionItem,
  TransactionItemWithRelations,
  CreateTransactionItemData
} from './transactions';
import type { Patient } from './patients';

export type ConsultationItem = TransactionItem;
export type ConsultationItemWithRelations = TransactionItemWithRelations;

/** Respuesta de GET /api/consultations/[id]/visit-context */
export interface ConsultationVisitContext {
  patient: Patient;
  appointment: {
    id: string;
    patientId: string;
    specialtyId: string;
    appointmentDate: string;
    status: string;
    specialty?: { id: string; name: string };
  } | null;
  preclinica: {
    id: string;
    presionArterial: string | null;
    temperatura: number | null;
    fc: number | null;
    fr: number | null;
    satO2: number | null;
    peso: number | null;
    talla: number | null;
    examenFisico: string | null;
    idc: string | null;
    tx: string | null;
    createdAt: string;
  } | null;
  match: 'linked' | 'inferred' | null;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string | null; // ID del doctor (nullable si la especialidad no tiene doctores)
  preclinicaId?: string | null;
  diagnosis: string | null;
  currentIllness: string | null;
  vitalSigns: string | null;
  treatment: string | null;
  observations: string | null;
  consultationDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
  };
  doctor?: {
    id: string;
    name: string;
    username: string;
    specialty?: {
      id: string;
      name: string;
    };
  } | null;
  items?: ConsultationItemWithRelations[];
}

export interface CreateConsultationData {
  patientId: string;
  doctorId?: string | null;
  preclinicaId?: string | null;
  diagnosis?: string;
  currentIllness?: string;
  vitalSigns?: string;
  treatment?: string;
  items?: CreateTransactionItemData[];
  observations?: string;
  status?: string;
}

export type CreateConsultationItemData = CreateTransactionItemData;

export interface UpdateConsultationData {
  doctorId?: string;
  preclinicaId?: string | null;
  diagnosis?: string;
  currentIllness?: string;
  vitalSigns?: string;
  treatment?: string;
  observations?: string;
  status?: string;
}
