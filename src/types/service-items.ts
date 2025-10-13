// ============================================
// TIPOS PARA SISTEMA DE ITEMS DE SERVICIO Y VARIANTES
// ============================================

// Tipo base para ServiceItem
export interface ServiceItem {
  id: string;
  name: string;
  description?: string | null;
  type: 'medicamento' | 'servicio';
  basePrice: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ServiceItem con sus relaciones cargadas
export interface ServiceItemWithRelations extends ServiceItem {
  variants: ServiceItemVariant[];
  tags: ServiceItemTag[];
  specialties: ServiceItemSpecialty[];
}

// Variante de item de servicio
export interface ServiceItemVariant {
  id: string;
  serviceItemId: string;
  name: string;
  description?: string | null;
  price: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Tag/Categoría
export interface Tag {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Specialty (ya existe pero la referenciamos)
export interface ServiceItemSpecialty {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

// Tag asociado a un ServiceItem (con datos completos del tag)
export interface ServiceItemTag extends Tag {
  // Hereda todas las propiedades de Tag
  serviceItemId?: string;
}

// ============================================
// TIPOS PARA CREAR/ACTUALIZAR
// ============================================

export interface CreateServiceItemData {
  name: string;
  description?: string;
  type: 'medicamento' | 'servicio';
  basePrice: number;
  tagIds: string[];           // IDs de los tags seleccionados
  specialtyIds?: string[];    // IDs de especialidades (solo si tiene tag "especialidad")
}

export interface UpdateServiceItemData {
  name?: string;
  description?: string;
  type?: 'medicamento' | 'servicio';
  basePrice?: number;
  isActive?: boolean;
  tagIds?: string[];
  specialtyIds?: string[];
}

export interface CreateVariantData {
  serviceItemId: string;
  name: string;
  description?: string;
  price: number;
}

export interface UpdateVariantData {
  name?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
}

// ============================================
// TIPOS PARA COMPONENTES
// ============================================

export interface ServiceItemFormData {
  name: string;
  description: string;
  type: 'medicamento' | 'servicio';
  basePrice: string;  // String para input, se convierte a number al guardar
  selectedTags: string[];
  selectedSpecialties: string[];
}

export interface VariantFormData {
  name: string;
  description: string;
  price: string;  // String para input
}

// Props para modales
export interface ServiceItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceItem?: ServiceItemWithRelations | null;
}

export interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceItemId: string;
  variant?: ServiceItemVariant | null;
}

// ============================================
// TIPOS DE RESPUESTA DE API
// ============================================

export interface ServiceItemsResponse {
  serviceItems: ServiceItemWithRelations[];
  total: number;
}

export interface ServiceItemResponse {
  serviceItem: ServiceItemWithRelations;
}

export interface VariantsResponse {
  variants: ServiceItemVariant[];
  total: number;
}

export interface TagsResponse {
  tags: Tag[];
}

// ============================================
// RE-EXPORTS PARA COMPATIBILIDAD (temporal)
// ============================================
// Mantener estos exports por compatibilidad con código existente
// TODO: Eventualmente eliminar estos y usar los nuevos nombres directamente

export type Price = ServiceItem;
export type PriceWithRelations = ServiceItemWithRelations;
export type PriceVariant = ServiceItemVariant;
export type PriceTag = ServiceItemTag;
export type PriceSpecialty = ServiceItemSpecialty;
export type CreatePriceData = CreateServiceItemData;
export type UpdatePriceData = UpdateServiceItemData;
export type PriceFormData = ServiceItemFormData;
export type PriceModalProps = ServiceItemModalProps;
export type PricesResponse = ServiceItemsResponse;
export type PriceResponse = ServiceItemResponse;

