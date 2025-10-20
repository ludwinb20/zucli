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

