// ============================================
// TIPOS PARA SISTEMA DE PRECIOS Y VARIANTES
// NOTA: Este archivo mantiene compatibilidad hacia atrás
// Los nuevos tipos están en service-items.ts
// ============================================

// Re-exportar todos los tipos desde service-items.ts
export type {
  ServiceItem as Price,
  ServiceItemWithRelations as PriceWithRelations,
  ServiceItemVariant as PriceVariant,
  ServiceItemTag as PriceTag,
  ServiceItemSpecialty as PriceSpecialty,
  Tag,
  CreateServiceItemData as CreatePriceData,
  UpdateServiceItemData as UpdatePriceData,
  CreateVariantData,
  UpdateVariantData,
  ServiceItemFormData as PriceFormData,
  VariantFormData,
  ServiceItemModalProps as PriceModalProps,
  VariantModalProps,
  ServiceItemsResponse as PricesResponse,
  ServiceItemResponse as PriceResponse,
  VariantsResponse,
  TagsResponse,
} from './service-items';
