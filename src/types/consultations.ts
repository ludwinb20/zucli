// Re-exportar tipos de transacciones
import type { 
  TransactionItem,
  TransactionItemWithRelations,
  CreateTransactionItemData
} from './transactions';

export type ConsultationItem = TransactionItem;
export type ConsultationItemWithRelations = TransactionItemWithRelations;

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
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
  };
  items?: ConsultationItemWithRelations[];
}

export interface CreateConsultationData {
  patientId: string;
  doctorId: string;
  diagnosis?: string;
  currentIllness?: string;
  vitalSigns?: string;
  treatment?: string;
  items?: CreateTransactionItemData[];
  observations?: string;
}

export type CreateConsultationItemData = CreateTransactionItemData;

export interface UpdateConsultationData {
  doctorId?: string;
  diagnosis?: string;
  currentIllness?: string;
  vitalSigns?: string;
  treatment?: string;
  observations?: string;
  status?: string;
}
