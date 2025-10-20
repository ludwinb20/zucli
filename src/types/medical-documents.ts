// ============================================
// TIPOS PARA DOCUMENTOS MÉDICOS
// ============================================

export type DocumentType = 'constancia' | 'incapacidad' | 'orden_examen';
export type Urgencia = 'normal' | 'urgente';

// Documento médico base
export interface MedicalDocument {
  id: string;
  patientId: string;
  issuedBy: string;
  documentType: DocumentType;
  constancia?: string | null;
  diagnostico?: string | null;
  diasReposo?: number | null;
  fechaInicio?: Date | string | null;
  fechaFin?: Date | string | null;
  tipoExamen?: string | null;
  indicaciones?: string | null;
  urgencia?: Urgencia | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Documento médico con relaciones
export interface MedicalDocumentWithRelations extends MedicalDocument {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
    birthDate: Date | string;
    gender: string;
  };
  issuer: {
    id: string;
    name: string;
    username: string;
  };
}

// ============================================
// DATOS PARA CREAR DOCUMENTOS
// ============================================

export interface CreateConstanciaData {
  patientId: string;
  constancia: string;
  documentType: 'constancia';
}

export interface CreateIncapacidadData {
  patientId: string;
  diagnostico: string;
  diasReposo: number;
  fechaInicio: string; // ISO date string
  documentType: 'incapacidad';
}

export interface CreateOrdenExamenData {
  patientId: string;
  tipoExamen: string;
  indicaciones: string;
  urgencia: Urgencia;
  documentType: 'orden_examen';
}

export type CreateMedicalDocumentData = 
  | CreateConstanciaData 
  | CreateIncapacidadData 
  | CreateOrdenExamenData;

// ============================================
// TIPOS DE RESPUESTA API
// ============================================

export interface MedicalDocumentsResponse {
  documents: MedicalDocumentWithRelations[];
  total: number;
}

export interface MedicalDocumentResponse {
  document: MedicalDocumentWithRelations;
}

// ============================================
// PROPS DE COMPONENTES
// ============================================

export interface MedicalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSuccess: () => void;
}

export interface PatientDocumentsSectionProps {
  patientId: string;
  documents: MedicalDocumentWithRelations[];
  onReprint: (documentId: string) => void;
  loading?: boolean;
}

// ============================================
// HELPERS
// ============================================

/**
 * Obtiene el nombre legible del tipo de documento
 */
export function getDocumentTypeName(type: DocumentType): string {
  const names = {
    constancia: 'Constancia Médica',
    incapacidad: 'Incapacidad',
    orden_examen: 'Orden de Examen',
  };
  return names[type];
}

/**
 * Obtiene el color del badge según el tipo
 */
export function getDocumentTypeColor(type: DocumentType): string {
  const colors = {
    constancia: 'bg-blue-100 text-blue-800',
    incapacidad: 'bg-orange-100 text-orange-800',
    orden_examen: 'bg-purple-100 text-purple-800',
  };
  return colors[type];
}

