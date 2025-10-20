/**
 * ============================================
 * TESTS CRÍTICOS DE CÁLCULOS DE DINERO
 * ============================================
 * 
 * Estos tests protegen TODO el dinero del sistema.
 * Cualquier fallo aquí significa que podrías estar
 * cobrando de más o de menos a los pacientes.
 * 
 * ⚠️ ESTOS TESTS NO DEBEN FALLAR NUNCA ⚠️
 */

import {
  calculateItemTotal,
  calculateDiscount,
  calculateItemTotalWithDiscount,
  calculateISV,
  extractISVFromTotal,
  addISVToSubtotal,
  sumItemTotals,
  calculatePaymentTotal,
  validatePrice,
  validateQuantity,
  roundToDecimals,
  CONSTANTS,
} from '../calculations';

describe('🧮 Cálculos Críticos de Dinero', () => {
  
  // ============================================
  // REDONDEO DE DECIMALES
  // ============================================
  describe('roundToDecimals', () => {
    it('debe redondear a 2 decimales por defecto', () => {
      expect(roundToDecimals(10.555)).toBe(10.56);
      expect(roundToDecimals(10.554)).toBe(10.55);
      expect(roundToDecimals(10.5)).toBe(10.5);
    });

    it('debe redondear a N decimales especificados', () => {
      expect(roundToDecimals(10.555, 1)).toBe(10.6);
      expect(roundToDecimals(10.555, 3)).toBe(10.555);
      expect(roundToDecimals(10.5555, 3)).toBe(10.556);
    });

    it('debe manejar ceros correctamente', () => {
      expect(roundToDecimals(0)).toBe(0);
      expect(roundToDecimals(0.001)).toBe(0);
      expect(roundToDecimals(0.005)).toBe(0.01);
    });
  });

  // ============================================
  // CÁLCULO DE TOTAL DE ITEM (CRÍTICO)
  // ============================================
  describe('💰 calculateItemTotal - CRÍTICO', () => {
    it('debe calcular total simple: 100 * 2 = 200', () => {
      expect(calculateItemTotal(100, 2)).toBe(200);
    });

    it('debe calcular total con decimales: 99.99 * 1 = 99.99', () => {
      expect(calculateItemTotal(99.99, 1)).toBe(99.99);
    });

    it('debe calcular total con cantidad múltiple: 10.50 * 3 = 31.50', () => {
      expect(calculateItemTotal(10.50, 3)).toBe(31.50);
    });

    it('debe redondear correctamente: 10.555 * 3 = 31.67', () => {
      expect(calculateItemTotal(10.555, 3)).toBe(31.67);
    });

    it('debe manejar precio cero: 0 * 5 = 0', () => {
      expect(calculateItemTotal(0, 5)).toBe(0);
    });

    it('debe manejar cantidad cero: 100 * 0 = 0', () => {
      expect(calculateItemTotal(100, 0)).toBe(0);
    });

    it('debe rechazar precio negativo', () => {
      expect(() => calculateItemTotal(-100, 2)).toThrow('El precio unitario no puede ser negativo');
    });

    it('debe rechazar cantidad negativa', () => {
      expect(() => calculateItemTotal(100, -2)).toThrow('La cantidad no puede ser negativa');
    });

    it('debe rechazar cantidad excesiva', () => {
      expect(() => calculateItemTotal(100, 9999999)).toThrow('La cantidad excede el máximo permitido');
    });

    it('debe rechazar valores no finitos (Infinity, NaN)', () => {
      expect(() => calculateItemTotal(Infinity, 2)).toThrow('Los valores deben ser números finitos');
      expect(() => calculateItemTotal(100, NaN)).toThrow('Los valores deben ser números finitos');
    });
  });

  // ============================================
  // CÁLCULO DE DESCUENTOS
  // ============================================
  describe('🎫 calculateDiscount', () => {
    it('debe calcular descuento porcentual: 10% de 100 = 10', () => {
      expect(calculateDiscount(100, 10, 'porcentaje')).toBe(10);
    });

    it('debe calcular descuento porcentual con decimales: 15% de 99.99 = 15.00', () => {
      expect(calculateDiscount(99.99, 15, 'porcentaje')).toBe(15);
    });

    it('debe calcular descuento absoluto: 15 de 100 = 15', () => {
      expect(calculateDiscount(100, 15, 'absoluto')).toBe(15);
    });

    it('debe manejar descuento 0%', () => {
      expect(calculateDiscount(100, 0, 'porcentaje')).toBe(0);
    });

    it('debe manejar descuento 100%', () => {
      expect(calculateDiscount(100, 100, 'porcentaje')).toBe(100);
    });

    it('debe rechazar descuento porcentual > 100%', () => {
      expect(() => calculateDiscount(100, 101, 'porcentaje')).toThrow('no puede ser mayor a 100%');
    });

    it('debe rechazar descuento absoluto mayor al subtotal', () => {
      expect(() => calculateDiscount(100, 150, 'absoluto')).toThrow('no puede ser mayor al subtotal');
    });

    it('debe rechazar subtotal negativo', () => {
      expect(() => calculateDiscount(-100, 10, 'porcentaje')).toThrow('El subtotal no puede ser negativo');
    });

    it('debe rechazar descuento negativo', () => {
      expect(() => calculateDiscount(100, -10, 'porcentaje')).toThrow('El descuento no puede ser negativo');
    });
  });

  // ============================================
  // CÁLCULO DE TOTAL CON DESCUENTO
  // ============================================
  describe('💳 calculateItemTotalWithDiscount', () => {
    it('debe calcular total sin descuento: 100 * 2 = 200', () => {
      const item = { precioUnitario: 100, quantity: 2 };
      expect(calculateItemTotalWithDiscount(item)).toBe(200);
    });

    it('debe aplicar descuento porcentual: (100 * 2) - 10% = 180', () => {
      const item = { 
        precioUnitario: 100, 
        quantity: 2, 
        descuento: 10, 
        descuentoTipo: 'porcentaje' as const
      };
      expect(calculateItemTotalWithDiscount(item)).toBe(180);
    });

    it('debe aplicar descuento absoluto: (100 * 2) - 20 = 180', () => {
      const item = { 
        precioUnitario: 100, 
        quantity: 2, 
        descuento: 20, 
        descuentoTipo: 'absoluto' as const
      };
      expect(calculateItemTotalWithDiscount(item)).toBe(180);
    });

    it('debe manejar descuento 0', () => {
      const item = { 
        precioUnitario: 100, 
        quantity: 2, 
        descuento: 0
      };
      expect(calculateItemTotalWithDiscount(item)).toBe(200);
    });

    it('debe usar tipo "absoluto" por defecto', () => {
      const item = { 
        precioUnitario: 100, 
        quantity: 2, 
        descuento: 10
      };
      expect(calculateItemTotalWithDiscount(item)).toBe(190);
    });
  });

  // ============================================
  // CÁLCULO DE ISV (15% - HONDURAS)
  // ============================================
  describe('🏛️ calculateISV - 15% Honduras', () => {
    it('debe calcular ISV correctamente: 15% de 100 = 15', () => {
      expect(calculateISV(100)).toBe(15);
    });

    it('debe calcular ISV con decimales: 15% de 99.99 = 15.00', () => {
      expect(calculateISV(99.99)).toBe(15);
    });

    it('debe manejar ISV de 0', () => {
      expect(calculateISV(0)).toBe(0);
    });

    it('debe redondear correctamente: 15% de 10.01 = 1.50', () => {
      expect(calculateISV(10.01)).toBe(1.5);
    });

    it('debe usar la tasa correcta del 15%', () => {
      expect(CONSTANTS.ISV_RATE).toBe(0.15);
    });

    it('debe rechazar subtotal negativo', () => {
      expect(() => calculateISV(-100)).toThrow('El subtotal no puede ser negativo');
    });
  });

  // ============================================
  // EXTRACCIÓN DE ISV (FACTURACIÓN LEGAL)
  // ============================================
  describe('📄 extractISVFromTotal - Para Facturas Legales', () => {
    it('debe extraer ISV correctamente: 115 total = 100 subtotal + 15 ISV', () => {
      const result = extractISVFromTotal(115);
      expect(result.subtotal).toBe(100);
      expect(result.isv).toBe(15);
      expect(result.total).toBe(115);
    });

    it('debe extraer ISV de 114.99: ~99.99 subtotal + ~15.00 ISV', () => {
      const result = extractISVFromTotal(114.99);
      expect(result.subtotal).toBe(99.99);
      expect(result.isv).toBe(15);
      expect(result.total).toBe(114.99);
    });

    it('debe manejar total = 0', () => {
      const result = extractISVFromTotal(0);
      expect(result.subtotal).toBe(0);
      expect(result.isv).toBe(0);
      expect(result.total).toBe(0);
    });

    it('debe redondear correctamente cantidades pequeñas', () => {
      const result = extractISVFromTotal(11.50);
      expect(result.subtotal).toBe(10);
      expect(result.isv).toBe(1.5);
      expect(result.total).toBe(11.50);
    });

    it('debe rechazar total negativo', () => {
      expect(() => extractISVFromTotal(-115)).toThrow('El total no puede ser negativo');
    });
  });

  // ============================================
  // AGREGAR ISV A SUBTOTAL
  // ============================================
  describe('➕ addISVToSubtotal', () => {
    it('debe agregar ISV: 100 + 15% = 115', () => {
      const result = addISVToSubtotal(100);
      expect(result.subtotal).toBe(100);
      expect(result.isv).toBe(15);
      expect(result.total).toBe(115);
    });

    it('debe agregar ISV a decimales: 99.99 + 15% = 114.99', () => {
      const result = addISVToSubtotal(99.99);
      expect(result.subtotal).toBe(99.99);
      expect(result.isv).toBe(15);
      expect(result.total).toBe(114.99);
    });

    it('debe manejar subtotal = 0', () => {
      const result = addISVToSubtotal(0);
      expect(result.subtotal).toBe(0);
      expect(result.isv).toBe(0);
      expect(result.total).toBe(0);
    });

    it('debe rechazar subtotal negativo', () => {
      expect(() => addISVToSubtotal(-100)).toThrow('El subtotal no puede ser negativo');
    });
  });

  // ============================================
  // SUMA DE TOTALES DE ITEMS
  // ============================================
  describe('📊 sumItemTotals', () => {
    it('debe sumar múltiples items sin descuento', () => {
      const items = [
        { precioUnitario: 100, quantity: 1 },
        { precioUnitario: 50, quantity: 2 }
      ];
      expect(sumItemTotals(items)).toBe(200);
    });

    it('debe sumar items con descuentos', () => {
      const items = [
        { precioUnitario: 100, quantity: 2, descuento: 10, descuentoTipo: 'porcentaje' as const },
        { precioUnitario: 50, quantity: 2 }
      ];
      // (100*2) - 10% = 180
      // (50*2) = 100
      // Total = 280
      expect(sumItemTotals(items)).toBe(280);
    });

    it('debe manejar array vacío', () => {
      expect(sumItemTotals([])).toBe(0);
    });

    it('debe rechazar input no-array', () => {
      expect(() => sumItemTotals({} as never)).toThrow('Los items deben ser un array');
    });

    it('debe sumar un solo item', () => {
      const items = [{ precioUnitario: 99.99, quantity: 1 }];
      expect(sumItemTotals(items)).toBe(99.99);
    });
  });

  // ============================================
  // CÁLCULO COMPLETO DE PAGO (CRÍTICO MÁXIMO)
  // ============================================
  describe('💰💰💰 calculatePaymentTotal - CRÍTICO MÁXIMO', () => {
    it('debe calcular pago simple sin ISV', () => {
      const items = [
        { precioUnitario: 100, quantity: 2 }
      ];
      const result = calculatePaymentTotal(items, false);
      
      expect(result.subtotal).toBe(200);
      expect(result.descuentos).toBe(0);
      expect(result.isv).toBe(0);
      expect(result.total).toBe(200);
    });

    it('debe calcular pago con ISV', () => {
      const items = [
        { precioUnitario: 100, quantity: 2 }
      ];
      const result = calculatePaymentTotal(items, true);
      
      expect(result.subtotal).toBe(200);
      expect(result.descuentos).toBe(0);
      expect(result.isv).toBe(30);
      expect(result.total).toBe(230);
    });

    it('debe aplicar descuento global porcentual antes del ISV', () => {
      const items = [
        { precioUnitario: 100, quantity: 2 }
      ];
      const result = calculatePaymentTotal(items, true, 10, 'porcentaje');
      
      // Subtotal: 200
      // Descuento 10%: 20
      // Subtotal con desc: 180
      // ISV 15%: 27
      // Total: 207
      expect(result.subtotal).toBe(200);
      expect(result.descuentos).toBe(20);
      expect(result.isv).toBe(27);
      expect(result.total).toBe(207);
    });

    it('debe aplicar descuento global absoluto antes del ISV', () => {
      const items = [
        { precioUnitario: 100, quantity: 2 }
      ];
      const result = calculatePaymentTotal(items, true, 50, 'absoluto');
      
      // Subtotal: 200
      // Descuento: 50
      // Subtotal con desc: 150
      // ISV 15%: 22.50
      // Total: 172.50
      expect(result.subtotal).toBe(200);
      expect(result.descuentos).toBe(50);
      expect(result.isv).toBe(22.5);
      expect(result.total).toBe(172.5);
    });

    it('debe calcular con múltiples items y descuentos individuales', () => {
      const items = [
        { precioUnitario: 100, quantity: 2, descuento: 10, descuentoTipo: 'porcentaje' as const },
        { precioUnitario: 50, quantity: 1 }
      ];
      const result = calculatePaymentTotal(items, true);
      
      // Item 1: (100*2) - 10% = 180
      // Item 2: 50
      // Subtotal: 230
      // ISV 15%: 34.50
      // Total: 264.50
      expect(result.subtotal).toBe(230);
      expect(result.isv).toBe(34.5);
      expect(result.total).toBe(264.5);
    });

    it('debe manejar items vacíos', () => {
      const result = calculatePaymentTotal([], false);
      
      expect(result.subtotal).toBe(0);
      expect(result.descuentos).toBe(0);
      expect(result.isv).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  // ============================================
  // VALIDACIONES
  // ============================================
  describe('✅ Validaciones', () => {
    describe('validatePrice', () => {
      it('debe aceptar precio válido', () => {
        expect(validatePrice(100)).toBe(true);
        expect(validatePrice(0)).toBe(true);
        expect(validatePrice(99.99)).toBe(true);
      });

      it('debe rechazar precio negativo', () => {
        expect(() => validatePrice(-1)).toThrow('El precio no puede ser negativo');
      });

      it('debe rechazar precio no finito', () => {
        expect(() => validatePrice(Infinity)).toThrow('El precio debe ser un número finito');
        expect(() => validatePrice(NaN)).toThrow('El precio debe ser un número finito');
      });
    });

    describe('validateQuantity', () => {
      it('debe aceptar cantidad válida', () => {
        expect(validateQuantity(1)).toBe(true);
        expect(validateQuantity(0)).toBe(true);
        expect(validateQuantity(100)).toBe(true);
      });

      it('debe rechazar cantidad negativa', () => {
        expect(() => validateQuantity(-1)).toThrow('La cantidad no puede ser negativa');
      });

      it('debe rechazar cantidad excesiva', () => {
        expect(() => validateQuantity(9999999)).toThrow('La cantidad excede el máximo permitido');
      });

      it('debe rechazar cantidad decimal', () => {
        expect(() => validateQuantity(1.5)).toThrow('La cantidad debe ser un número entero');
      });

      it('debe rechazar cantidad no finita', () => {
        expect(() => validateQuantity(Infinity)).toThrow('La cantidad debe ser un número finito');
        expect(() => validateQuantity(NaN)).toThrow('La cantidad debe ser un número finito');
      });
    });
  });

  // ============================================
  // CONSTANTES DEL SISTEMA
  // ============================================
  describe('🔢 Constantes del Sistema', () => {
    it('debe tener ISV_RATE = 0.15 (15%)', () => {
      expect(CONSTANTS.ISV_RATE).toBe(0.15);
    });

    it('debe tener DECIMAL_PLACES = 2', () => {
      expect(CONSTANTS.DECIMAL_PLACES).toBe(2);
    });

    it('debe tener MIN_PRICE = 0', () => {
      expect(CONSTANTS.MIN_PRICE).toBe(0);
    });

    it('debe tener MAX_QUANTITY razonable', () => {
      expect(CONSTANTS.MAX_QUANTITY).toBe(999999);
    });
  });
});

