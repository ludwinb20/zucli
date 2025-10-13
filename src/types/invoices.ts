// ============================================
// TIPOS PARA SISTEMA DE FACTURACIÓN LEGAL
// ============================================

// Estados del rango de facturación
export type InvoiceRangeStatus = 'activo' | 'vencido' | 'agotado';

// Rango de Facturación (CAI)
export interface InvoiceRange {
  id: string;
  rtn: string;
  razonSocial: string;
  nombreComercial: string;
  cai: string;
  fechaLimiteEmision: Date | string;
  puntoEmision: string;
  rangoInicio: number;
  rangoFin: number;
  correlativoActual: number;
  cantidadAutorizada: number;
  estado: InvoiceRangeStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Rango de facturación con sus facturas
export interface InvoiceRangeWithInvoices extends InvoiceRange {
  invoices: LegalInvoice[];
}

// ============================================
// ITEMS DE FACTURA Y RECIBO
// ============================================

// Item de Factura Legal
export interface LegalInvoiceItem {
  id: string;
  legalInvoiceId: string;
  priceId?: string | null;
  variantId?: string | null;
  
  // Snapshot de datos
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  
  createdAt: Date | string;
}

// Item de Recibo Simple
export interface SimpleReceiptItem {
  id: string;
  simpleReceiptId: string;
  priceId?: string | null;
  variantId?: string | null;
  
  // Snapshot de datos
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  
  createdAt: Date | string;
}

// ============================================
// RECIBO SIMPLE (SIN RTN)
// ============================================

export interface SimpleReceipt {
  id: string;
  paymentId: string;
  type: string; // "simple"
  numeroDocumento: string; // Número del recibo
  fechaEmision: Date | string;
  
  // Información del emisor
  emisorNombre: string;
  emisorRTN?: string | null;
  emisorRazonSocial?: string | null;
  
  // Información del cliente
  clienteNombre: string;
  clienteIdentidad: string;
  clienteRTN?: string | null;
  
  // Información fiscal
  cai?: string | null;
  
  // Detalle y montos
  detalleGenerico: boolean;
  subtotal: number;
  descuentos: number;
  isv: number;
  total: number;
  observaciones?: string | null;
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SimpleReceiptWithRelations extends SimpleReceipt {
  payment: {
    id: string;
    patientId: string;
    total: number;
    patient: {
      firstName: string;
      lastName: string;
      identityNumber: string;
    };
  };
  items: SimpleReceiptItem[];
}

export interface CreateSimpleReceiptData {
  paymentId: string;
  clienteNombre: string;
  detalleGenerico?: boolean;
  observaciones?: string;
}

// ============================================
// FACTURA LEGAL (CON RTN)
// ============================================

// Factura Legal
export interface LegalInvoice {
  id: string;
  paymentId: string;
  type: string; // "legal"
  invoiceRangeId?: string | null;
  
  // Información de la factura
  numeroDocumento: string; // Número de factura completo
  correlativo?: number | null;
  fechaEmision: Date | string;
  
  // Información del emisor (histórico)
  emisorNombre: string;
  emisorRTN?: string | null;
  emisorRazonSocial?: string | null;
  cai?: string | null;
  
  // Información del cliente (siempre con RTN en facturas fiscales)
  clienteRTN?: string | null;
  clienteNombre: string;
  clienteIdentidad: string;
  
  // Detalle y montos
  detalleGenerico: boolean;
  subtotal: number;
  descuentos: number;
  isv: number;
  total: number;
  
  // Información adicional
  observaciones?: string | null;
  
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Factura legal con relaciones
export interface LegalInvoiceWithRelations extends LegalInvoice {
  payment: {
    id: string;
    patientId: string;
    total: number;
    patient: {
      firstName: string;
      lastName: string;
      identityNumber: string;
    };
  };
  invoiceRange: InvoiceRange;
  items: LegalInvoiceItem[];
}

// ============================================
// TIPOS PARA CREAR/ACTUALIZAR
// ============================================

// Datos para crear un rango de facturación
export interface CreateInvoiceRangeData {
  rtn: string;
  razonSocial: string;
  nombreComercial: string;
  cai: string;
  fechaLimiteEmision: Date | string;
  puntoEmision: string;
  rangoInicio: number;
  rangoFin: number;
}

// Datos para actualizar un rango
export interface UpdateInvoiceRangeData {
  estado?: InvoiceRangeStatus;
  correlativoActual?: number;
}

// Datos para crear una factura legal
export interface CreateLegalInvoiceData {
  paymentId: string;
  clienteRTN?: string;
  clienteNombre: string;
  detalleGenerico?: boolean;
  observaciones?: string;
}

// ============================================
// TIPOS DE RESPUESTA DE API
// ============================================

export interface InvoiceRangesResponse {
  ranges: InvoiceRangeWithInvoices[];
  total: number;
}

export interface InvoiceRangeResponse {
  range: InvoiceRangeWithInvoices;
}

export interface LegalInvoicesResponse {
  invoices: LegalInvoiceWithRelations[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
}

export interface LegalInvoiceResponse {
  invoice: LegalInvoiceWithRelations;
}

// ============================================
// TIPOS PARA COMPONENTES
// ============================================

export interface InvoiceRangeFormData {
  rtn: string;
  razonSocial: string;
  nombreComercial: string;
  cai: string;
  fechaLimiteEmision: string;
  puntoEmision: string;
  rangoInicio: string;
  rangoFin: string;
}

export interface InvoiceRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  range?: InvoiceRange | null;
}

