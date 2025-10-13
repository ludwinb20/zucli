// ============================================
// TIPOS PARA SISTEMA DE PAGOS
// ============================================

import { TransactionItem, TransactionItemWithRelations } from './transactions';

// Estado de pago
export type PaymentStatus = 'pendiente' | 'paid' | 'cancelado';

// Tipo de fuente del pago
export type PaymentSourceType = 'consultation' | 'sale' | 'hospitalization';

// Re-exportar TransactionItem como PaymentItem para compatibilidad
export type PaymentItem = TransactionItem;
export type PaymentItemWithRelations = TransactionItemWithRelations;

// Pago base
export interface Payment {
  id: string;
  patientId: string;
  
  // Fuente del pago (solo una debe estar presente)
  consultationId?: string | null;
  saleId?: string | null;
  hospitalizationId?: string | null;
  
  status: PaymentStatus;
  total: number;
  createdBy?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Pago con relaciones completas
export interface PaymentWithRelations extends Payment {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
  };
  
  // Relaciones opcionales a las fuentes
  consultation?: {
    id: string;
    doctorId: string;
    consultationDate: Date | string;
  } | null;
  
  sale?: {
    id: string;
    type: string;
    createdAt: Date | string;
  } | null;
  
  hospitalization?: {
    id: string;
    roomNumber?: string | null;
    admissionDate: Date | string;
  } | null;
  
  // Items obtenidos de la fuente
  items?: TransactionItemWithRelations[];
}

// ============================================
// TIPOS PARA CREAR/ACTUALIZAR
// ============================================

// Item para crear pago (compatibilidad)
export interface CreatePaymentItemData {
  priceId: string;         // Se mapea a serviceItemId
  variantId?: string;
  nombre: string;
  precioUnitario: number;
  quantity: number;
}

// Datos para crear un pago directo (crea Sale automáticamente)
export interface CreatePaymentData {
  patientId: string;
  items: CreatePaymentItemData[];
  notes?: string;
}

// Datos para crear un pago desde una fuente existente
export interface CreatePaymentFromSourceData {
  patientId: string;
  consultationId?: string;
  saleId?: string;
  hospitalizationId?: string;
  notes?: string;
}

// Datos para actualizar un pago
export interface UpdatePaymentData {
  status?: PaymentStatus;
  notes?: string;
}

// ============================================
// TIPOS DE RESPUESTA DE API
// ============================================

export interface PaymentsResponse {
  payments: PaymentWithRelations[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
}

export interface PaymentResponse {
  payment: PaymentWithRelations;
}

// ============================================
// TIPOS PARA COMPONENTES
// ============================================

export interface PaymentFormData {
  patientId: string;
  items: CreatePaymentItemData[];
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  payment?: PaymentWithRelations | null;
}

export interface PaymentItemSelectorProps {
  items: CreatePaymentItemData[];
  onChange: (items: CreatePaymentItemData[]) => void;
  patientId?: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Obtiene el tipo de fuente de un pago
 */
export function getPaymentSourceType(payment: Payment | PaymentWithRelations): PaymentSourceType | null {
  if (payment.consultationId) return 'consultation';
  if (payment.saleId) return 'sale';
  if (payment.hospitalizationId) return 'hospitalization';
  return null;
}

/**
 * Obtiene el ID de la fuente de un pago
 */
export function getPaymentSourceId(payment: Payment | PaymentWithRelations): string | null {
  return payment.consultationId || payment.saleId || payment.hospitalizationId || null;
}

/**
 * Obtiene un nombre legible de la fuente del pago
 */
export function getPaymentSourceName(payment: Payment | PaymentWithRelations): string {
  if (payment.consultationId) return 'Consulta Médica';
  if (payment.saleId) return 'Venta Directa';
  if (payment.hospitalizationId) return 'Hospitalización';
  return 'Sin origen';
}
