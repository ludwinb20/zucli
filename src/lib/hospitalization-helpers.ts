import { HospitalizationCostCalculation } from '@/types/hospitalization';

/**
 * Calcula los días de estancia en una hospitalización
 * @param admissionDate Fecha de ingreso
 * @param dischargeDate Fecha de alta (opcional, usa hoy si no se proporciona)
 * @returns Número de días de estancia (mínimo 1)
 */
export function calculateDaysOfStay(
  admissionDate: Date | string,
  dischargeDate?: Date | string | null
): number {
  const admission = new Date(admissionDate);
  const discharge = dischargeDate ? new Date(dischargeDate) : new Date();
  
  // Calcular diferencia en milisegundos
  const diffTime = Math.abs(discharge.getTime() - admission.getTime());
  
  // Convertir a días y redondear hacia arriba
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Mínimo 1 día (mismo día cuenta como 1 día)
  return diffDays || 1;
}

/**
 * Calcula el costo total de una hospitalización basado en días de estancia
 * @param admissionDate Fecha de ingreso
 * @param dailyRate Tarifa diaria (puede ser basePrice o precio de variante)
 * @param dischargeDate Fecha de alta (opcional)
 * @returns Objeto con cálculo detallado del costo
 */
export function calculateHospitalizationCost(
  admissionDate: Date | string,
  dailyRate: number,
  dischargeDate?: Date | string | null
): HospitalizationCostCalculation {
  const daysOfStay = calculateDaysOfStay(admissionDate, dischargeDate);
  
  return {
    daysOfStay,
    dailyRate,
    totalCost: daysOfStay * dailyRate,
    admissionDate: new Date(admissionDate).toISOString(),
    dischargeDate: dischargeDate ? new Date(dischargeDate).toISOString() : null,
  };
}

/**
 * Obtiene la tarifa diaria correcta (variante o precio base)
 * @param dailyRateItem Item de servicio configurado
 * @param dailyRateVariant Variante seleccionada (opcional)
 * @returns Tarifa diaria a aplicar
 */
export function getDailyRate(
  dailyRateItem?: { basePrice: number } | null,
  dailyRateVariant?: { price: number } | null
): number {
  if (!dailyRateItem) return 0;
  return dailyRateVariant?.price || dailyRateItem.basePrice;
}

/**
 * Formatea los días de estancia para mostrar
 * @param days Número de días
 * @returns String formateado (ej: "5 días" o "1 día")
 */
export function formatDaysOfStay(days: number): string {
  return `${days} día${days !== 1 ? 's' : ''}`;
}

/**
 * Verifica si una hospitalización está activa
 * @param status Status de la hospitalización
 * @returns true si está iniciada (activa)
 */
export function isHospitalizationActive(status: string): boolean {
  return status === 'iniciada';
}

/**
 * Obtiene la configuración de badge para el status
 * @param status Status de la hospitalización
 * @returns Objeto con label y color
 */
export function getHospitalizationStatusBadge(status: string): {
  label: string;
  color: string;
} {
  const config: Record<string, { label: string; color: string }> = {
    iniciada: { label: 'Activa', color: 'bg-green-100 text-green-800' },
    alta: { label: 'Dada de Alta', color: 'bg-gray-100 text-gray-800' },
  };
  
  return config[status] || config.iniciada;
}

/**
 * Calcula el último día cobrado en una hospitalización
 * @param payments Array de pagos de hospitalización ordenados por fecha
 * @returns Fecha del último día cobrado o null si no hay pagos
 */
export function getLastPaidDate(
  payments: Array<{
    daysCoveredEndDate?: Date | string | null;
    status?: string;
    isActive?: boolean;
  }> | null | undefined
): Date | null {
  if (!payments || payments.length === 0) {
    return null;
  }

  // Filtrar solo pagos activos y que tengan días cobrados
  const activePaymentsWithDays = payments
    .filter(p => p.isActive && p.status !== 'cancelado' && p.daysCoveredEndDate)
    .map(p => new Date(p.daysCoveredEndDate!))
    .filter(date => !isNaN(date.getTime()));

  if (activePaymentsWithDays.length === 0) {
    return null;
  }

  // Retornar la fecha más reciente
  return new Date(Math.max(...activePaymentsWithDays.map(d => d.getTime())));
}

/**
 * Calcula los días pendientes de pago en una hospitalización
 * @param admissionDate Fecha de ingreso
 * @param payments Array de pagos de hospitalización
 * @param referenceDate Fecha de referencia para calcular (por defecto hoy)
 * @returns Objeto con información de días pendientes
 */
export function calculatePendingDays(
  admissionDate: Date | string,
  payments: Array<{
    daysCoveredEndDate?: Date | string | null;
    status?: string;
    isActive?: boolean;
  }> | null | undefined,
  referenceDate?: Date | string
): {
  startDate: Date;
  endDate: Date;
  daysCount: number;
  hasPendingDays: boolean;
} {
  const admission = new Date(admissionDate);
  const reference = referenceDate ? new Date(referenceDate) : new Date();
  
  // Si la referencia es anterior a la admisión, retornar 0 días
  if (reference < admission) {
    return {
      startDate: admission,
      endDate: admission,
      daysCount: 0,
      hasPendingDays: false,
    };
  }

  // Obtener el último día cobrado
  const lastPaidDate = getLastPaidDate(payments);

  // Si no hay pagos, los días pendientes son desde admisión hasta referencia
  if (!lastPaidDate) {
    const days = calculateDaysOfStay(admission, reference);
    return {
      startDate: admission,
      endDate: reference,
      daysCount: days,
      hasPendingDays: days > 0,
    };
  }

  // Calcular días desde el último día pagado + 1 hasta la fecha de referencia
  const startPending = new Date(lastPaidDate);
  startPending.setDate(startPending.getDate() + 1); // Día siguiente al último pagado
  
  // Si la fecha de inicio de pendientes es posterior a la referencia, no hay días pendientes
  if (startPending > reference) {
    return {
      startDate: admission,
      endDate: lastPaidDate,
      daysCount: 0,
      hasPendingDays: false,
    };
  }

  const days = calculateDaysOfStay(startPending, reference);
  
  return {
    startDate: startPending,
    endDate: reference,
    daysCount: days,
    hasPendingDays: days > 0,
  };
}

/**
 * Verifica si hay solapamiento de días entre un rango de fechas y los pagos existentes
 * @param startDate Fecha de inicio del nuevo pago
 * @param endDate Fecha de fin del nuevo pago
 * @param payments Array de pagos existentes de hospitalización
 * @returns true si hay solapamiento, false si no hay
 */
export function hasDaysOverlap(
  startDate: Date | string,
  endDate: Date | string,
  payments: Array<{
    daysCoveredStartDate?: Date | string | null;
    daysCoveredEndDate?: Date | string | null;
    status?: string;
    isActive?: boolean;
  }> | null | undefined
): boolean {
  if (!payments || payments.length === 0) {
    return false;
  }

  const newStart = new Date(startDate);
  const newEnd = new Date(endDate);

  // Verificar solapamiento con cada pago activo
  for (const payment of payments) {
    if (!payment.isActive || payment.status === 'cancelado') {
      continue;
    }

    if (!payment.daysCoveredStartDate || !payment.daysCoveredEndDate) {
      continue;
    }

    const paidStart = new Date(payment.daysCoveredStartDate);
    const paidEnd = new Date(payment.daysCoveredEndDate);

    // Verificar si hay solapamiento
    // Solapamiento ocurre si: (newStart <= paidEnd && newEnd >= paidStart)
    if (newStart <= paidEnd && newEnd >= paidStart) {
      return true;
    }
  }

  return false;
}

