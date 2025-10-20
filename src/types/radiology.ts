// Tipos para el módulo de Radiología

export type RadiologyOrderStatus = 'pending' | 'completed';

export interface RadiologyOrder {
  id: string;
  patientId: string;
  paymentId: string;
  status: RadiologyOrderStatus;
  findings?: string | null;
  diagnosis?: string | null;
  images?: string | null;
  performedBy?: string | null;
  notes?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RadiologyOrderWithRelations extends RadiologyOrder {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
    birthDate: Date;
    gender: string;
  };
  payment: {
    id: string;
    total: number;
    status: string;
    createdAt: Date;
    sale?: {
      transactionItems: Array<{
        id: string;
        nombre: string;
        quantity: number;
      }>;
    };
  };
  performer?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateRadiologyOrderData {
  patientId: string;
  paymentId: string;
  notes?: string;
}

export interface UpdateRadiologyOrderData {
  status?: RadiologyOrderStatus;
  findings?: string;
  diagnosis?: string;
  images?: string;
  performedBy?: string;
  notes?: string;
  completedAt?: Date | string;
}

export interface RadiologyOrderListItem {
  id: string;
  patientName: string;
  patientIdentity: string;
  status: RadiologyOrderStatus;
  total: number;
  createdAt: Date;
  completedAt?: Date | null;
  performedByName?: string | null;
}

// Props para componentes

export interface RadiologyOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RadiologyOrderWithRelations | null;
  onUpdate: () => void;
}

export interface RadiologyResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RadiologyOrderWithRelations | null;
  onSave: (data: UpdateRadiologyOrderData) => Promise<void>;
  isLoading: boolean;
}

