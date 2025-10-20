/**
 * ============================================
 * FUNCIONES DE CÁLCULO CRÍTICAS
 * ============================================
 * 
 * Este módulo centraliza TODOS los cálculos relacionados con dinero.
 * Cualquier operación matemática que involucre precios, totales, 
 * descuentos o impuestos DEBE estar aquí.
 * 
 * ⚠️ IMPORTANTE: Estos cálculos manejan dinero real.
 * Cualquier cambio debe tener tests exhaustivos.
 */

/**
 * Interfaz para un item de transacción
 */
export interface TransactionItemInput {
  precioUnitario: number;
  quantity: number;
  descuento?: number; // Descuento en porcentaje (0-100) o valor absoluto
  descuentoTipo?: 'porcentaje' | 'absoluto';
}

/**
 * Interfaz para cálculo de ISV
 */
export interface ISVCalculation {
  subtotal: number;
  isv: number;
  total: number;
}

/**
 * Constantes del sistema
 */
export const CONSTANTS = {
  ISV_RATE: 0.15, // 15% ISV en Honduras
  DECIMAL_PLACES: 2,
  MIN_PRICE: 0,
  MAX_QUANTITY: 999999,
} as const;

/**
 * Redondea un número a N decimales
 * @param value - Valor a redondear
 * @param decimals - Número de decimales (default: 2)
 * @returns Valor redondeado
 */
export function roundToDecimals(value: number, decimals: number = CONSTANTS.DECIMAL_PLACES): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calcula el total de un item: precioUnitario * quantity
 * 
 * @param precioUnitario - Precio unitario del item
 * @param quantity - Cantidad de items
 * @returns Total calculado (redondeado a 2 decimales)
 * 
 * @example
 * calculateItemTotal(100, 2) // 200.00
 * calculateItemTotal(99.99, 1) // 99.99
 * calculateItemTotal(10.555, 3) // 31.67
 */
export function calculateItemTotal(precioUnitario: number, quantity: number): number {
  // Validaciones
  if (precioUnitario < CONSTANTS.MIN_PRICE) {
    throw new Error(`El precio unitario no puede ser negativo: ${precioUnitario}`);
  }
  
  if (quantity < 0) {
    throw new Error(`La cantidad no puede ser negativa: ${quantity}`);
  }
  
  if (quantity > CONSTANTS.MAX_QUANTITY) {
    throw new Error(`La cantidad excede el máximo permitido: ${quantity}`);
  }
  
  if (!Number.isFinite(precioUnitario) || !Number.isFinite(quantity)) {
    throw new Error('Los valores deben ser números finitos');
  }
  
  const total = precioUnitario * quantity;
  return roundToDecimals(total);
}

/**
 * Calcula el descuento a aplicar
 * 
 * @param subtotal - Subtotal antes del descuento
 * @param descuento - Valor del descuento
 * @param tipo - Tipo de descuento ('porcentaje' o 'absoluto')
 * @returns Monto del descuento (redondeado a 2 decimales)
 * 
 * @example
 * calculateDiscount(100, 10, 'porcentaje') // 10.00 (10% de 100)
 * calculateDiscount(100, 15, 'absoluto') // 15.00
 * calculateDiscount(100, 0, 'porcentaje') // 0.00
 */
export function calculateDiscount(
  subtotal: number, 
  descuento: number, 
  tipo: 'porcentaje' | 'absoluto' = 'absoluto'
): number {
  if (subtotal < 0) {
    throw new Error(`El subtotal no puede ser negativo: ${subtotal}`);
  }
  
  if (descuento < 0) {
    throw new Error(`El descuento no puede ser negativo: ${descuento}`);
  }
  
  if (tipo === 'porcentaje') {
    if (descuento > 100) {
      throw new Error(`El descuento porcentual no puede ser mayor a 100%: ${descuento}`);
    }
    return roundToDecimals((subtotal * descuento) / 100);
  }
  
  // Tipo absoluto
  if (descuento > subtotal) {
    throw new Error(`El descuento absoluto (${descuento}) no puede ser mayor al subtotal (${subtotal})`);
  }
  
  return roundToDecimals(descuento);
}

/**
 * Calcula el total de un item con descuento
 * 
 * @param item - Item de transacción con precio, cantidad y descuento opcional
 * @returns Total calculado después de aplicar descuento (redondeado a 2 decimales)
 * 
 * @example
 * calculateItemTotalWithDiscount({ 
 *   precioUnitario: 100, 
 *   quantity: 2, 
 *   descuento: 10, 
 *   descuentoTipo: 'porcentaje' 
 * }) // 180.00 (200 - 10% = 180)
 */
export function calculateItemTotalWithDiscount(item: TransactionItemInput): number {
  const subtotal = calculateItemTotal(item.precioUnitario, item.quantity);
  
  if (!item.descuento || item.descuento === 0) {
    return subtotal;
  }
  
  const descuentoMonto = calculateDiscount(
    subtotal, 
    item.descuento, 
    item.descuentoTipo || 'absoluto'
  );
  
  return roundToDecimals(subtotal - descuentoMonto);
}

/**
 * Calcula el ISV (15%) sobre un subtotal
 * 
 * @param subtotal - Subtotal antes del ISV
 * @returns Monto del ISV (redondeado a 2 decimales)
 * 
 * @example
 * calculateISV(100) // 15.00
 * calculateISV(99.99) // 15.00
 * calculateISV(0) // 0.00
 */
export function calculateISV(subtotal: number): number {
  if (subtotal < 0) {
    throw new Error(`El subtotal no puede ser negativo: ${subtotal}`);
  }
  
  return roundToDecimals(subtotal * CONSTANTS.ISV_RATE);
}

/**
 * Calcula el subtotal, ISV y total a partir de un total que YA incluye ISV
 * Útil para extraer el ISV de un precio final
 * 
 * @param totalConISV - Total que incluye ISV
 * @returns Objeto con subtotal, ISV y total desglosados
 * 
 * @example
 * extractISVFromTotal(115) // { subtotal: 100, isv: 15, total: 115 }
 * extractISVFromTotal(114.99) // { subtotal: 99.99, isv: 15.00, total: 114.99 }
 */
export function extractISVFromTotal(totalConISV: number): ISVCalculation {
  if (totalConISV < 0) {
    throw new Error(`El total no puede ser negativo: ${totalConISV}`);
  }
  
  // Fórmula: subtotal = total / (1 + tasa_ISV)
  const subtotal = roundToDecimals(totalConISV / (1 + CONSTANTS.ISV_RATE));
  const isv = roundToDecimals(totalConISV - subtotal);
  
  return {
    subtotal,
    isv,
    total: totalConISV,
  };
}

/**
 * Calcula el total con ISV a partir de un subtotal
 * 
 * @param subtotal - Subtotal antes del ISV
 * @returns Objeto con subtotal, ISV y total
 * 
 * @example
 * addISVToSubtotal(100) // { subtotal: 100, isv: 15, total: 115 }
 */
export function addISVToSubtotal(subtotal: number): ISVCalculation {
  if (subtotal < 0) {
    throw new Error(`El subtotal no puede ser negativo: ${subtotal}`);
  }
  
  const isv = calculateISV(subtotal);
  const total = roundToDecimals(subtotal + isv);
  
  return {
    subtotal,
    isv,
    total,
  };
}

/**
 * Suma los totales de múltiples items
 * 
 * @param items - Array de items con sus totales calculados
 * @returns Total general (redondeado a 2 decimales)
 * 
 * @example
 * sumItemTotals([
 *   { precioUnitario: 100, quantity: 1 },
 *   { precioUnitario: 50, quantity: 2 }
 * ]) // 200.00
 */
export function sumItemTotals(items: TransactionItemInput[]): number {
  if (!Array.isArray(items)) {
    throw new Error('Los items deben ser un array');
  }
  
  if (items.length === 0) {
    return 0;
  }
  
  const total = items.reduce((sum, item) => {
    return sum + calculateItemTotalWithDiscount(item);
  }, 0);
  
  return roundToDecimals(total);
}

/**
 * Calcula el total de un pago completo con todos sus items
 * 
 * @param items - Array de items del pago
 * @param aplicarISV - Si se debe aplicar ISV al total
 * @param descuentoGlobal - Descuento global sobre el subtotal (opcional)
 * @param descuentoGlobalTipo - Tipo de descuento global
 * @returns Objeto con el desglose completo del pago
 * 
 * @example
 * calculatePaymentTotal([
 *   { precioUnitario: 100, quantity: 2 }
 * ], true) // { subtotal: 200, descuentos: 0, isv: 30, total: 230 }
 */
export function calculatePaymentTotal(
  items: TransactionItemInput[],
  aplicarISV: boolean = false,
  descuentoGlobal: number = 0,
  descuentoGlobalTipo: 'porcentaje' | 'absoluto' = 'absoluto'
): {
  subtotal: number;
  descuentos: number;
  isv: number;
  total: number;
} {
  // Sumar todos los items
  const subtotal = sumItemTotals(items);
  
  // Aplicar descuento global si existe
  const descuentos = descuentoGlobal > 0 
    ? calculateDiscount(subtotal, descuentoGlobal, descuentoGlobalTipo)
    : 0;
  
  const subtotalConDescuento = roundToDecimals(subtotal - descuentos);
  
  // Aplicar ISV si corresponde
  const isv = aplicarISV ? calculateISV(subtotalConDescuento) : 0;
  
  const total = roundToDecimals(subtotalConDescuento + isv);
  
  return {
    subtotal,
    descuentos,
    isv,
    total,
  };
}

/**
 * Valida que un precio sea válido
 * 
 * @param precio - Precio a validar
 * @returns true si el precio es válido
 * @throws Error si el precio es inválido
 */
export function validatePrice(precio: number): boolean {
  if (!Number.isFinite(precio)) {
    throw new Error('El precio debe ser un número finito');
  }
  
  if (precio < CONSTANTS.MIN_PRICE) {
    throw new Error(`El precio no puede ser negativo: ${precio}`);
  }
  
  return true;
}

/**
 * Valida que una cantidad sea válida
 * 
 * @param quantity - Cantidad a validar
 * @returns true si la cantidad es válida
 * @throws Error si la cantidad es inválida
 */
export function validateQuantity(quantity: number): boolean {
  if (!Number.isFinite(quantity)) {
    throw new Error('La cantidad debe ser un número finito');
  }
  
  if (quantity < 0) {
    throw new Error(`La cantidad no puede ser negativa: ${quantity}`);
  }
  
  if (quantity > CONSTANTS.MAX_QUANTITY) {
    throw new Error(`La cantidad excede el máximo permitido: ${quantity}`);
  }
  
  if (!Number.isInteger(quantity)) {
    throw new Error(`La cantidad debe ser un número entero: ${quantity}`);
  }
  
  return true;
}

