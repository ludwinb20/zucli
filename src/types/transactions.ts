// ============================================
// TIPOS PARA SISTEMA DE TRANSACCIONES
// ============================================

// Tipo de fuente de la transacción
export type TransactionSourceType = 'consultation' | 'sale' | 'hospitalization' | 'surgery';

// Item de transacción base
export interface TransactionItem {
  id: string;
  sourceType: TransactionSourceType;
  sourceId: string;
  serviceItemId: string;
  variantId?: string | null;
  quantity: number;
  nombre: string;
  precioUnitario: number;
  descuento: number;
  total: number;
  addedBy?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Item de transacción con relaciones
export interface TransactionItemWithRelations extends TransactionItem {
  serviceItem: {
    id: string;
    name: string;
    type: string;
    basePrice: number;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
  } | null;
}

// Data para crear item de transacción
export interface CreateTransactionItemData {
  serviceItemId: string;
  variantId?: string | null;
  quantity: number;
  nombre: string;
  precioUnitario: number;
  descuento?: number;
  total: number;
  addedBy?: string;
  notes?: string;
}

// ============================================
// TIPOS PARA MÓDULOS
// ============================================

// Sale (Venta Directa)
export interface Sale {
  id: string;
  patientId?: string | null;
  cashierId: string;
  type: string;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SaleWithRelations extends Sale {
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
  } | null;
  cashier: {
    id: string;
    name: string;
    username: string;
  };
  items?: TransactionItemWithRelations[];
}

export interface CreateSaleData {
  patientId?: string;
  cashierId: string;
  type?: string;
  notes?: string;
  items: CreateTransactionItemData[];
}

// Hospitalization
export interface Hospitalization {
  id: string;
  patientId: string;
  doctorId: string;
  roomNumber?: string | null;
  admissionDate: Date | string;
  dischargeDate?: Date | string | null;
  diagnosis?: string | null;
  status: string;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface HospitalizationWithRelations extends Hospitalization {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
  };
  doctor: {
    id: string;
    name: string;
    specialty?: {
      id: string;
      name: string;
    };
  };
  items?: TransactionItemWithRelations[];
}

export interface CreateHospitalizationData {
  patientId: string;
  doctorId: string;
  roomNumber?: string;
  diagnosis?: string;
  notes?: string;
  items?: CreateTransactionItemData[];
}

// ============================================
// HELPERS
// ============================================

// Helper para obtener items de cualquier fuente
export function getTransactionItems(payment: {
  consultation?: { items?: TransactionItemWithRelations[] };
  sale?: { items?: TransactionItemWithRelations[] };
  hospitalization?: { items?: TransactionItemWithRelations[] };
}): TransactionItemWithRelations[] {
  // Buscar items en la fuente correspondiente
  if (payment.consultation?.items) {
    return payment.consultation.items;
  }
  if (payment.sale?.items) {
    return payment.sale.items;
  }
  if (payment.hospitalization?.items) {
    return payment.hospitalization.items;
  }
  return [];
}

// Helper para obtener el total de items
export function calculateItemsTotal(items: TransactionItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0);
}

