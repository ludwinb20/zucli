// ============================================
// TIPOS PARA SISTEMA DE PAGOS
// ============================================

import { TransactionItem, TransactionItemWithRelations } from './transactions';

// Estado de pago
export type PaymentStatus = 'pendiente' | 'paid' | 'cancelado';

// Método de pago
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

// Tipo de fuente del pago
export type PaymentSourceType = 'consultation' | 'sale' | 'hospitalization' | 'radiology' | 'surgery';

// Re-exportar TransactionItem como PaymentItem para compatibilidad
export type PaymentItem = TransactionItem;
export type PaymentItemWithRelations = TransactionItemWithRelations;

// ============================================
// REEMBOLSOS
// ============================================

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  createdBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateRefundData {
  paymentId: string;
  amount: number;
  reason: string;
}

// Pago base
export interface Payment {
  id: string;
  patientId: string;
  
  // Fuente del pago (solo una debe estar presente)
  consultationId?: string | null;
  saleId?: string | null;
  hospitalizationId?: string | null;
  surgeryId?: string | null;
  
  status: PaymentStatus;
  total: number;
  paymentMethod?: string | null;
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
  
  surgery?: {
    id: string;
    createdAt: Date | string;
    status: string;
  } | null;
  
  // Items obtenidos de la fuente
  items?: TransactionItemWithRelations[];
  
  // Reembolsos asociados
  refunds?: Refund[];
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
  type?: 'sale' | 'radiology'; // Tipo de pago: venta normal o radiología
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
  if (payment.surgeryId) return 'surgery';
  return null;
}

/**
 * Obtiene el ID de la fuente de un pago
 */
export function getPaymentSourceId(payment: Payment | PaymentWithRelations): string | null {
  return payment.consultationId || payment.saleId || payment.hospitalizationId || payment.surgeryId || null;
}

/**
 * Obtiene un nombre legible de la fuente del pago
 */
export function getPaymentSourceName(payment: Payment | PaymentWithRelations): string {
  if (payment.consultationId) return 'Consulta Médica';
  if (payment.saleId) return 'Venta Directa';
  if (payment.hospitalizationId) return 'Hospitalización';
  if (payment.surgeryId) return 'Cirugía';
  // @ts-expect-error - radiologyOrder existe en la interfaz con relaciones
  if (payment.radiologyOrder) return 'Rayos X / Radiología';
  return 'Sin origen';
}
