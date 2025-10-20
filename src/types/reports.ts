// ============================================
// TIPOS DE FILTROS
// ============================================

export interface IncomeReportFilters {
  startDate: string;
  endDate: string;
  tags?: string[]; // IDs de tags
  specialtyId?: string;
}

export interface AccountingReportFilters {
  startDate: string;
  endDate: string;
}

export interface AuxiliaryBookFilters {
  startDate: string;
  endDate: string;
}

// ============================================
// DATOS DE REPORTES
// ============================================

export interface InvoiceDetail {
  id: string;
  numeroDocumento: string;
  fechaEmision: string | Date;
  clienteNombre: string;
  clienteIdentidad: string;
  total: number;
  items: {
    id: string;
    nombre: string;
    quantity: number;
    precioUnitario: number;
    total: number;
  }[];
}

export interface IncomeSummaryByTag {
  tagName: string;
  count: number;
  total: number;
}

export interface IncomeSummaryBySpecialty {
  specialtyName: string;
  count: number;
  total: number;
}

export interface IncomeReportData {
  summary: {
    totalInvoices: number;
    totalAmount: number;
    byTag: IncomeSummaryByTag[];
    bySpecialty: IncomeSummaryBySpecialty[];
  };
  details: InvoiceDetail[];
}

export interface AccountingReportData {
  invoices: {
    id: string;
    numeroDocumento: string;
    fechaEmision: string | Date;
    clienteNombre: string;
    clienteIdentidad: string;
    total: number;
  }[];
  totalAmount: number;
  totalCount: number;
}

export interface DailyTotal {
  date: string;
  invoiceCount: number;
  total: number;
}

export interface AuxiliaryBookData {
  dailyTotals: DailyTotal[];
  totalInvoices: number;
  totalAmount: number;
}

// ============================================
// HELPERS
// ============================================

export function getDefaultDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  return {
    startDate: firstDayOfMonth.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
}

export function formatDateForDisplay(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('es-HN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

