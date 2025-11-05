import { LucideIcon } from 'lucide-react';

// Common Component Props
export interface StandardModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  showCard?: boolean;
  action?: React.ReactNode;
}

export interface LoadingStateProps {
  message?: string;
  showCard?: boolean;
}

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export interface PageHeaderProps {
  title: string;
  description: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  children?: React.ReactNode;
}

// Filter and Data List Components
export interface FilterField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date';
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export interface FilterPanelProps {
  title?: string;
  fields: FilterField[];
  showCard?: boolean;
  className?: string;
}

export interface DataListItem {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  metadata?: Array<{
    icon?: LucideIcon;
    label: string;
  }>;
  notes?: string;
  actions?: Array<{
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
    className?: string;
  }>;
}

export interface DataListProps {
  title: string;
  items: DataListItem[];
  emptyMessage: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  listIcon?: LucideIcon;
  showCard?: boolean;
}

// Patient Search Component
export interface PatientSearchProps {
  value: string;
  onChange: (patientId: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  onAddNewPatient?: () => void;
}

// Modal Props
export interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    status: string;
    [key: string]: unknown;
  };
  newStatus: string;
  onSave: (appointmentId: string, status: string) => Promise<void>;
  isLoading?: boolean;
}

export interface ChangeSpecialtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    specialtyId: string;
    [key: string]: unknown;
  };
  specialties: Array<{
    id: string;
    name: string;
    [key: string]: unknown;
  }>;
  onSave: (appointmentId: string, specialtyId: string) => Promise<void>;
  isLoading?: boolean;
}

export interface ReprogramAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: string;
    date: string;
    [key: string]: unknown;
  };
  onSave: (appointmentId: string, newDate: Date) => Promise<void>;
  isLoading?: boolean;
}

export interface PatientAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patientId: string, appointmentData: Record<string, unknown>) => void;
  specialties: Array<{
    id: string;
    name: string;
    [key: string]: unknown;
  }>;
  isLoading?: boolean;
}

// Preclinica Data Types
export interface PreclinicaData {
  id?: string;
  presionArterial: string;
  temperatura: string;
  fc: string;
  fr: string;
  satO2: string;
  peso: string;
  talla: string;
  examenFisico: string;
  idc: string;
  tx: string;
  createdAt?: string;
}

export interface PreclinicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: {
    id: string;
    preclinica?: PreclinicaData;
    [key: string]: unknown;
  };
  hospitalizationId?: string;
  onSave: (id: string, preclinicaData: PreclinicaData) => Promise<void>;
  isLoading?: boolean;
}

// Examen Físico Data Types
export interface ExamenFisicoData {
  id?: string;
  aparienciaGeneral?: string;
  cabeza?: string;
  ojos?: string;
  orl?: string;
  torax?: string;
  corazon?: string;
  pulmones?: string;
  abdomen?: string;
  genitoUrinario?: string;
  extremidades?: string;
  osteoarticular?: string;
  pielYPaneras?: string;
  neurologicos?: string;
  columna?: string;
  comentarios?: string;
  diagnostico?: string;
  createdAt?: string;
}

export interface ExamenFisicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId?: string;
  onSave: (id: string, examenFisicoData: ExamenFisicoData) => Promise<void>;
  isLoading?: boolean;
}

// Consulta Data Types
export interface TreatmentItem {
  id: string;
  type: 'price' | 'variant' | 'custom';
  priceId?: string | null;
  variantId?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  isCustom?: boolean; // true si es un item variable creado por el usuario
}

export interface ConsultaData {
  sintomas: string;
  diagnostico: string;
  tratamientoNotas: string;
  treatmentItems: TreatmentItem[];
  observaciones: string;
}

