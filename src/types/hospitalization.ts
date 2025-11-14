import type { MedicationName } from "./medications";

// Tipos para el módulo de hospitalización

export type HospitalizationStatus = 'iniciada' | 'completada';
export type RoomStatus = 'available' | 'occupied';

// ============================================
// CONTROL DE INSULINA
// ============================================

export interface InsulinControl {
  id: string;
  hospitalizationId: string;
  resultado: number; // mg/dL
  insulinaAdministrada: number; // unidades
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateInsulinControlData {
  resultado: number;
  insulinaAdministrada: number;
}

// ============================================
// EXAMEN FÍSICO
// ============================================

export interface ExamenFisico {
  id: string;
  hospitalizationId: string;
  aparienciaGeneral?: string | null;
  cabeza?: string | null;
  ojos?: string | null;
  orl?: string | null;
  torax?: string | null;
  corazon?: string | null;
  pulmones?: string | null;
  abdomen?: string | null;
  genitoUrinario?: string | null;
  extremidades?: string | null;
  osteoarticular?: string | null;
  pielYPaneras?: string | null;
  neurologicos?: string | null;
  columna?: string | null;
  comentarios?: string | null;
  diagnostico?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateExamenFisicoData {
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
}

// ============================================
// CONTROL DE MEDICAMENTOS Y SERVICIOS
// ============================================

export interface MedicationControlItem {
  id: string;
  medicationControlId: string;
  serviceItemId?: string | null;
  variantId?: string | null;
  medicationNameId?: string | null;
  quantity: number;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  serviceItem?: {
    id: string;
    name: string;
    type: string;
    basePrice: number;
  } | null;
  variant?: {
    id: string;
    name: string;
    price: number;
  } | null;
  medicationName?: MedicationName | null;
}

export interface MedicationControl {
  id: string;
  hospitalizationId: string;
  notes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: MedicationControlItem[];
}

export interface CreateMedicationControlItemData {
  serviceItemId?: string;
  variantId?: string;
  medicationNameId?: string;
  quantity: number;
}

export interface CreateMedicationControlData {
  items: CreateMedicationControlItemData[];
}

// ============================================
// NOTAS DE ENFERMERÍA
// ============================================

export interface NursingNote {
  id: string;
  hospitalizationId: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateNursingNoteData {
  content: string;
}

// ============================================
// REGISTRO DE ADMISIÓN
// ============================================

export interface AdmissionAnnotation {
  id: string;
  admissionRecordId: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AdmissionOrder {
  id: string;
  admissionRecordId: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AdmissionRecord {
  id: string;
  hospitalizationId: string;
  // Historia Clínica
  hea?: string | null;
  fog?: string | null;
  antecedentesPatologicos?: string | null;
  antecedentesInmunoAlergicos?: string | null;
  antecedentesGO?: string | null;
  antecedentesTraumaticosQuirurgicos?: string | null;
  antecedentesFamiliares?: string | null;
  // Órdenes y Anotaciones Médicas
  dieta?: string | null;
  signosVitalesHoras?: number | null;
  semifowler: boolean;
  fowler: boolean;
  liquidosIV?: string | null;
  medicamentos?: string | null;
  examenesLaboratorio?: string | null;
  glocometria?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  anotaciones?: AdmissionAnnotation[];
  ordenes?: AdmissionOrder[];
}

export interface CreateAdmissionRecordData {
  // Historia Clínica
  hea?: string;
  fog?: string;
  antecedentesPatologicos?: string;
  antecedentesInmunoAlergicos?: string;
  antecedentesGO?: string;
  antecedentesTraumaticosQuirurgicos?: string;
  antecedentesFamiliares?: string;
  // Órdenes y Anotaciones Médicas
  dieta?: string;
  signosVitalesHoras?: number;
  semifowler: boolean;
  fowler: boolean;
  liquidosIV?: string;
  medicamentos?: string;
  examenesLaboratorio?: string;
  glocometria?: string;
  // Anotaciones y Órdenes
  anotaciones: string[]; // Array de strings
  ordenes: string[];     // Array de strings
}

// ============================================
// REGISTRO DE ALTA
// ============================================

export type CondicionSalida = 'Mejorado' | 'Igual' | 'Curado';

export interface DischargeRecord {
  id: string;
  hospitalizationId: string;
  // Información de Alta
  diagnosticoIngreso?: string | null;
  diagnosticoEgreso?: string | null;
  resumenClinico?: string | null;
  tratamiento?: string | null;
  condicionSalida?: CondicionSalida | null;
  recomendaciones?: string | null;
  // Cita de Consulta Externa
  citaConsultaExterna: boolean;
  citaId?: string | null;
  // Cálculo de días
  diasEstancia: number;
  costoTotal: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  // Relaciones
  cita?: {
    id: string;
    appointmentDate: string | Date;
    status: string;
    specialty: {
      id: string;
      name: string;
    };
  } | null;
}

export interface CreateDischargeRecordData {
  // Información de Alta
  diagnosticoIngreso?: string;
  diagnosticoEgreso?: string;
  resumenClinico?: string;
  tratamiento?: string;
  condicionSalida?: CondicionSalida;
  recomendaciones?: string;
  // Cita de Consulta Externa
  citaConsultaExterna: boolean;
  citaFecha?: string;
  citaHora?: string;
  citaEspecialidadId?: string;
  // Nota: La cita se creará en la tabla appointments y se guardará el ID aquí
}

// ============================================
// CONTROL DE INGESTAS Y EXCRETAS
// ============================================

export type IntakeType = 'oral' | 'parenteral';
export type ExcretaType = 'orina' | 'heces' | 'vomitos' | 'sng' | 'drenaje' | 'otros';
export type IntakeOutputType = 'ingesta' | 'excreta';

export interface IntakeOutputControl {
  id: string;
  hospitalizationId: string;
  type: IntakeOutputType;
  // Campos para ingestas
  ingestaType?: IntakeType | null;
  cantidad?: number | null; // ml
  // Campos para excretas
  excretaType?: ExcretaType | null;
  excretaCantidad?: number | null; // ml
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateIntakeOutputControlData {
  type: IntakeOutputType;
  // Para ingestas
  ingestaType?: IntakeType;
  cantidad?: number;
  // Para excretas
  excretaType?: ExcretaType;
  excretaCantidad?: number;
}

export interface Room {
  id: string;
  number: string;
  status: RoomStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SalaDoctor {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Hospitalization {
  id: string;
  patientId: string;
  medicoSalaUserId?: string | null;
  roomId?: string | null;
  dailyRateItemId?: string | null;
  admissionDate: string;
  dischargeDate?: string | null;
  diagnosis?: string | null;
  status: HospitalizationStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HospitalizationWithRelations extends Hospitalization {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
    birthDate: string;
    gender: string;
  };
  medicoSalaUser?: {
    id: string;
    name: string;
    username: string;
  } | null;
  room?: Room | null;
  dailyRateItem?: {
    id: string;
    name: string;
    basePrice: number;
    variants?: Array<{
      id: string;
      name: string;
      price: number;
      isActive?: boolean;
    }>;
  } | null;
  dailyRateVariant?: {
    id: string;
    name: string;
    price: number;
  } | null;
  preclinicas: Array<{
    id: string;
    createdAt: string;
    presionArterial?: string | null;
    temperatura?: number | null;
    fc?: number | null;
    fr?: number | null;
    satO2?: number | null;
    peso?: number | null;
    talla?: number | null;
  }>;
  insulinControls?: InsulinControl[];
  intakeOutputControls?: IntakeOutputControl[];
  examenFisicos?: ExamenFisico[];
  medicationControls?: MedicationControl[];
  nursingNotes?: NursingNote[];
  admissionRecord?: AdmissionRecord | null;
  dischargeRecord?: DischargeRecord | null;
  costCalculation?: HospitalizationCostCalculation | null;
}

export interface CreateHospitalizationData {
  patientId: string;
  medicoSalaUserId?: string;
  roomId?: string;
  dailyRateItemId?: string;
  dailyRateVariantId?: string;
  diagnosis?: string;
  notes?: string;
}

export interface UpdateHospitalizationData {
  roomId?: string;
  dailyRateItemId?: string;
  diagnosis?: string;
  notes?: string;
  status?: HospitalizationStatus;
  dischargeDate?: string;
}

// Para el cálculo de cobro
export interface HospitalizationCostCalculation {
  daysOfStay: number;
  dailyRate: number;
  totalCost: number;
  admissionDate: string;
  dischargeDate?: string | null;
}

// Props de modales
export interface HospitalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateHospitalizationData) => Promise<void>;
  hospitalization?: HospitalizationWithRelations | null;
}

export interface HospitalizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalization: HospitalizationWithRelations | null;
  onUpdate: () => void;
}

export interface DischargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalization: HospitalizationWithRelations | null;
  onDischarge: (dischargeDate: string, notes?: string) => Promise<void>;
}

export interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { number: string; status?: RoomStatus }) => Promise<void>;
  room?: Room | null;
}

