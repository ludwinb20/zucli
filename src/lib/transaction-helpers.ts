import { TransactionItem, TransactionSourceType } from '@/types/transactions';

/**
 * Obtiene los items de transacción desde cualquier fuente
 */
export function getTransactionItems(source: {
  items?: TransactionItem[];
  consultation?: { items?: TransactionItem[] };
  sale?: { items?: TransactionItem[] };
  hospitalization?: { items?: TransactionItem[] };
} | null): TransactionItem[] {
  if (!source) return [];
  
  // Si ya tiene items directamente (cuando se hace query con sourceType y sourceId)
  if (source.items && Array.isArray(source.items)) {
    return source.items;
  }
  
  // Si es un payment con fuentes anidadas
  if (source.consultation?.items) return source.consultation.items;
  if (source.sale?.items) return source.sale.items;
  if (source.hospitalization?.items) return source.hospitalization.items;
  
  return [];
}

/**
 * Calcula el total de una lista de items
 */
export function calculateItemsTotal(items: TransactionItem[]): number {
  return items.reduce((sum, item) => sum + item.total, 0);
}

/**
 * Obtiene los items de un pago
 */
export async function getPaymentItems(
  prisma: {
    payment: {
      findUnique: (args: unknown) => Promise<unknown>;
    };
    transactionItem: {
      findMany: (args: unknown) => Promise<TransactionItem[]>;
    };
  },
  paymentId: string
): Promise<TransactionItem[]> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      consultation: true,
      sale: true,
      hospitalization: true,
    }
  }) as {
    consultationId?: string | null;
    saleId?: string | null;
    hospitalizationId?: string | null;
  } | null;

  if (!payment) return [];

  // Determinar la fuente y obtener items
  let sourceType: TransactionSourceType | null = null;
  let sourceId: string | null = null;

  if (payment.consultationId) {
    sourceType = 'consultation';
    sourceId = payment.consultationId;
  } else if (payment.saleId) {
    sourceType = 'sale';
    sourceId = payment.saleId;
  } else if (payment.hospitalizationId) {
    sourceType = 'hospitalization';
    sourceId = payment.hospitalizationId;
  }

  if (!sourceType || !sourceId) return [];

  // Obtener items de la fuente
  const items = await prisma.transactionItem.findMany({
    where: {
      sourceType,
      sourceId
    },
    include: {
      serviceItem: {
        select: {
          id: true,
          name: true,
          type: true,
          basePrice: true,
        }
      },
      variant: {
        select: {
          id: true,
          name: true,
          price: true,
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return items;
}

/**
 * Obtiene la fuente de un pago
 */
export function getPaymentSource(payment: {
  consultationId?: string | null;
  consultation?: unknown;
  saleId?: string | null;
  sale?: unknown;
  hospitalizationId?: string | null;
  hospitalization?: unknown;
}): {
  type: TransactionSourceType | null;
  id: string | null;
  data: unknown;
} {
  if (payment.consultationId) {
    return {
      type: 'consultation',
      id: payment.consultationId,
      data: payment.consultation
    };
  }
  if (payment.saleId) {
    return {
      type: 'sale',
      id: payment.saleId,
      data: payment.sale
    };
  }
  if (payment.hospitalizationId) {
    return {
      type: 'hospitalization',
      id: payment.hospitalizationId,
      data: payment.hospitalization
    };
  }
  return { type: null, id: null, data: null };
}

/**
 * Calcula el total de items de una fuente específica
 */
export async function calculateSourceTotal(
  prisma: {
    transactionItem: {
      findMany: (args: unknown) => Promise<TransactionItem[]>;
    };
  },
  sourceType: TransactionSourceType,
  sourceId: string
): Promise<number> {
  const items = await prisma.transactionItem.findMany({
    where: {
      sourceType,
      sourceId
    }
  });

  return calculateItemsTotal(items);
}

