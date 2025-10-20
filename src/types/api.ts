// ============================================
// TIPOS PARA RUTAS API
// ============================================

// Tipos para filtros de Prisma
export interface PrismaWhereFilter {
  type?: string;
  OR?: Array<{
    clienteNombre?: { contains: string };
    numeroDocumento?: { contains: string };
    clienteIdentidad?: { contains: string };
    clienteRTN?: { contains: string };
  }>;
}

export interface PrismaSalesWhereFilter {
  patientId?: string;
  cashierId?: string;
  status?: string;
  OR?: Array<{
    patient?: {
      firstName?: { contains: string };
      lastName?: { contains: string };
      identityNumber?: { contains: string };
    };
    id?: { contains: string };
  }>;
}

export interface PrismaPricesWhereFilter {
  name?: { contains: string };
  type?: string;
  isActive?: boolean;
  tags?: {
    some: {
      id: string;
    };
  };
  specialties?: {
    some: {
      id: string;
    };
  };
}

// Tipos para resultados de queries raw
export interface PatientRawResult {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | Date;
  gender: string;
  identityNumber: string;
  phone: string | null;
  address: string | null;
  emergencyContactName: string | null;
  emergencyContactNumber: string | null;
  emergencyContactRelation: string | null;
  medicalHistory: string | null;
  allergies: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CountRawResult {
  count: string;
}

// Tipos para tags y specialties en sorting
export interface TagForSorting {
  id: string;
  name: string;
}

export interface SpecialtyForSorting {
  id: string;
}

export interface ServiceItemForSorting {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  tags: TagForSorting[];
  specialties: SpecialtyForSorting[];
}

// Tipos para session user (para evitar as any)
export interface SessionUser {
  id: string;
  role?: {
    name: string;
  } | string;
}

// Helper function para obtener el role name
export function getUserRoleName(user: SessionUser): string | undefined {
  if (typeof user.role === 'string') {
    return user.role;
  }
  return user.role?.name;
}

// Tipos para TransactionItem con relaciones
export interface TransactionItemWithRelations {
  id: string;
  sourceType: string;
  sourceId: string;
  serviceItemId: string;
  variantId: string | null;
  quantity: number;
  nombre: string;
  precioUnitario: number;
  descuento: number;
  total: number;
  addedBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  serviceItem: {
    id: string;
    name: string;
    type: string;
    basePrice: number;
  };
  variant: {
    id: string;
    name: string;
    price: number;
  } | null;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    limit: number;
  };
}
