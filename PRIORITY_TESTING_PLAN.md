# 🎯 Plan Prioritario de Testing

## 📊 Funciones Críticas Identificadas

Basado en el análisis del código, estas son las **10 funciones más críticas** que deben tener tests:

---

## 🔴 **PRIORIDAD MÁXIMA** - Dinero y Cálculos

### 1. ⭐⭐⭐ Cálculo de Totales de TransactionItems
**Ubicación**: `src/app/api/payments/route.ts:218`
```typescript
total: item.precioUnitario * item.quantity
```

**¿Por qué es crítico?**
- Maneja dinero real
- Si falla, cobras de más/menos a pacientes
- Impacta facturación legal

**Tests necesarios**:
```typescript
describe('TransactionItem Total Calculation', () => {
  it('should calculate total correctly: price * quantity');
  it('should handle decimal prices correctly');
  it('should handle zero quantity');
  it('should handle negative prices (refunds)');
  it('should apply discounts correctly');
  it('should round to 2 decimal places');
});
```

---

### 2. ⭐⭐⭐ Generación de Facturas Legales
**Ubicación**: `src/lib/thermal-printer.ts`
```typescript
generateLegalInvoice()
generateLegalInvoiceFromDB()
```

**¿Por qué es crítico?**
- Requiere cumplimiento legal (SAR Honduras)
- Debe tener CAI, rango autorizado, fecha límite
- Errores pueden resultar en multas

**Tests necesarios**:
```typescript
describe('Legal Invoice Generation', () => {
  it('should include CAI number');
  it('should use correct invoice range');
  it('should validate range is not expired');
  it('should calculate ISV (15%) correctly');
  it('should format RTN correctly');
  it('should include all required legal fields');
  it('should throw error if range exhausted');
});
```

---

### 3. ⭐⭐⭐ Validación de Número de Identidad Hondureño
**Ubicación**: `src/components/PatientModal.tsx` (línea 124-126)
```typescript
if (!identityParts.part1 || !identityParts.part2 || !identityParts.part3) {
  newErrors.identityNumber = "El número de identidad es requerido";
}
```

**¿Por qué es crítico?**
- Identificación única de pacientes
- Formato legal: `0801-1990-12345`
- Errores causan duplicados o registros inválidos

**Tests necesarios**:
```typescript
describe('Honduras Identity Number Validation', () => {
  it('should validate format XXXX-YYYY-XXXXX');
  it('should reject invalid department codes');
  it('should validate birth year is realistic');
  it('should reject future dates');
  it('should detect duplicate identity numbers');
});
```

---

## 🟠 **PRIORIDAD ALTA** - Lógica de Negocio

### 4. ⭐⭐ Validación de Rangos de Facturas
**Ubicación**: `src/app/admin/page.tsx`
```typescript
const remaining = parseInt(invoiceRange.rangoFin) - parseInt(invoiceRange.rangoInicio) - invoiceRange.invoicesCount;
```

**¿Por qué es crítico?**
- SAR audita esto
- Debe prevenir uso de facturas fuera de rango
- Debe alertar cuando se agota

**Tests necesarios**:
```typescript
describe('Invoice Range Validation', () => {
  it('should calculate remaining invoices correctly');
  it('should prevent use when range exhausted');
  it('should prevent use after expiration date');
  it('should validate CAI format');
  it('should enforce sequential numbering');
});
```

---

### 5. ⭐⭐ Cálculo de Pagos con Items
**Ubicación**: `src/app/api/payments/route.ts`
```typescript
const totalItems = items.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
```

**¿Por qué es crítico?**
- Suma total del pago
- Impacta caja y facturación
- Errores en descuentos o ISV

**Tests necesarios**:
```typescript
describe('Payment Total Calculation', () => {
  it('should sum all items correctly');
  it('should handle multiple items');
  it('should apply global discounts');
  it('should calculate ISV when applicable');
  it('should handle empty item list');
});
```

---

### 6. ⭐⭐ Actualización de Estado de Pagos a "Paid"
**Ubicación**: `src/app/api/invoices/generate/route.ts`
```typescript
await prisma.payment.update({
  where: { id: payment.id },
  data: { status: 'paid' }
});
```

**¿Por qué es crítico?**
- Previene doble facturación
- Impacta reportes contables
- Estado incorrecto = caos en caja

**Tests necesarios**:
```typescript
describe('Payment Status Update', () => {
  it('should update to paid after invoice generation');
  it('should prevent generating invoice twice');
  it('should rollback if invoice generation fails');
  it('should update timestamp correctly');
});
```

---

## 🟡 **PRIORIDAD MEDIA** - Integridad de Datos

### 7. ⭐ Creación de Pacientes con Validaciones
**Ubicación**: `src/app/api/patients/route.ts`

**¿Por qué es importante?**
- Base de todo el sistema
- Duplicados causan problemas legales
- Datos incompletos = consultas inválidas

**Tests necesarios**:
```typescript
describe('Patient Creation', () => {
  it('should prevent duplicate identity numbers');
  it('should require all mandatory fields');
  it('should validate birthDate is in the past');
  it('should format phone numbers consistently');
  it('should trim whitespace from names');
});
```

---

### 8. ⭐ Asignación de Items a Transacciones
**Ubicación**: `src/lib/transaction-helpers.ts`

**¿Por qué es importante?**
- Vincula items con consultas/ventas
- Errores causan pérdida de tracking
- Impacta inventario y facturación

**Tests necesarios**:
```typescript
describe('Transaction Item Assignment', () => {
  it('should link items to correct source');
  it('should snapshot price at transaction time');
  it('should preserve item name even if product deleted');
  it('should handle quantity correctly');
});
```

---

## 🟢 **PRIORIDAD BAJA** - Utilidades

### 9. Formateo de Números de Identidad
**Ubicación**: `src/lib/formatters.ts`

**Tests necesarios**:
```typescript
describe('Identity Number Formatting', () => {
  it('should format as XXXX-YYYY-XXXXX');
  it('should handle already formatted numbers');
  it('should remove non-numeric characters');
});
```

---

### 10. Formateo de Moneda
**Ubicación**: `src/lib/formatters.ts`

**Tests necesarios**:
```typescript
describe('Currency Formatting', () => {
  it('should format as L X,XXX.XX');
  it('should handle negative values');
  it('should round to 2 decimals');
});
```

---

## 🚀 Plan de Implementación (4 Semanas)

### Semana 1: Crítico de Dinero
- [ ] Tests de cálculo de totales (TransactionItem)
- [ ] Tests de cálculo de pagos
- [ ] Tests de formateo de moneda
- **Meta**: Cálculos de dinero 100% cubiertos

### Semana 2: Facturación Legal
- [ ] Tests de generación de facturas legales
- [ ] Tests de validación de rangos
- [ ] Tests de actualización de estado
- **Meta**: Sistema de facturación confiable

### Semana 3: Validaciones
- [ ] Tests de número de identidad
- [ ] Tests de creación de pacientes
- [ ] Tests de datos duplicados
- **Meta**: Integridad de datos garantizada

### Semana 4: Transacciones
- [ ] Tests de asignación de items
- [ ] Tests de snapshots de precios
- [ ] Tests de relaciones
- **Meta**: Tracking completo de transacciones

---

## 📁 Estructura de Archivos a Crear

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── calculations.test.ts       ⭐⭐⭐ PRIORIDAD MÁXIMA
│   │   ├── invoice-generation.test.ts ⭐⭐⭐ PRIORIDAD MÁXIMA
│   │   ├── validators.test.ts         ⭐⭐⭐ PRIORIDAD MÁXIMA
│   │   └── formatters.test.ts         ⭐   PRIORIDAD BAJA (YA EXISTE ✅)
│   │
│   ├── calculations.ts                 (CREAR - extraer lógica)
│   ├── validators.ts                   (CREAR - extraer validaciones)
│   └── thermal-printer.ts              (EXISTENTE - testear)
│
├── app/api/
│   ├── payments/
│   │   └── __tests__/
│   │       └── calculations.test.ts   ⭐⭐ PRIORIDAD ALTA
│   ├── invoices/
│   │   └── __tests__/
│   │       └── generation.test.ts     ⭐⭐ PRIORIDAD ALTA
│   └── patients/
│       └── __tests__/
│           └── patients.test.ts       ⭐  PRIORIDAD MEDIA (YA EXISTE ✅)
```

---

## 🎯 Objetivo de Coverage por Módulo

| Módulo | Coverage Actual | Meta Semana 1 | Meta Semana 4 |
|--------|----------------|---------------|---------------|
| **Cálculos de dinero** | 0% | 90% | 95% |
| **Facturación legal** | 0% | 70% | 85% |
| **Validaciones** | 0% | 60% | 80% |
| **APIs críticas** | 0% | 50% | 70% |
| **Utilidades** | 59.7% | 70% | 85% |
| **GLOBAL** | 5.72% | 25% | 50% |

---

## 💰 ROI (Retorno de Inversión) de Estos Tests

### Tests de Cálculos de Dinero (Semana 1)
- **Tiempo**: 8-12 horas
- **Previene**: 
  - Errores de cobro (reclamaciones de pacientes)
  - Pérdidas por cobro de menos
  - Problemas con SAR por ISV incorrecto
- **ROI**: 🔥 ALTÍSIMO - Un solo error cuesta más que el tiempo de testing

### Tests de Facturación Legal (Semana 2)
- **Tiempo**: 12-16 horas
- **Previene**:
  - Multas de SAR Honduras
  - Facturas inválidas
  - Problemas de auditoría
- **ROI**: 🔥 ALTÍSIMO - Multas de SAR son costosas

### Tests de Validaciones (Semana 3)
- **Tiempo**: 8-10 horas
- **Previene**:
  - Pacientes duplicados
  - Datos inconsistentes
  - Problemas legales con identidades
- **ROI**: 🟢 ALTO - Mejora calidad de datos

### Tests de Transacciones (Semana 4)
- **Tiempo**: 6-8 horas
- **Previene**:
  - Items perdidos
  - Tracking incorrecto
  - Reportes erróneos
- **ROI**: 🟡 MEDIO - Mejora operativa

---

## 🎓 Recursos y Ejemplos

### Ejemplo de Test Crítico Real

```typescript
// src/lib/__tests__/calculations.test.ts
import { calculateTransactionTotal } from '../calculations';

describe('Transaction Total Calculation', () => {
  it('should calculate simple total correctly', () => {
    const item = {
      precioUnitario: 100,
      quantity: 2,
      descuento: 0
    };
    
    const total = calculateTransactionTotal(item);
    expect(total).toBe(200);
  });

  it('should handle decimal prices with ISV', () => {
    const item = {
      precioUnitario: 99.99,
      quantity: 1,
      descuento: 0,
      incluyeISV: true
    };
    
    const total = calculateTransactionTotal(item);
    // 99.99 + 15% ISV = 114.99
    expect(total).toBeCloseTo(114.99, 2);
  });

  it('should apply discount before ISV', () => {
    const item = {
      precioUnitario: 100,
      quantity: 1,
      descuento: 10, // 10%
      incluyeISV: true
    };
    
    const total = calculateTransactionTotal(item);
    // (100 - 10) + 15% ISV = 103.50
    expect(total).toBeCloseTo(103.50, 2);
  });
});
```

---

## ✅ Checklist de Inicio Rápido

Para empezar HOY MISMO:

- [ ] Crear archivo `src/lib/calculations.ts`
- [ ] Crear archivo `src/lib/__tests__/calculations.test.ts`
- [ ] Escribir 5 tests de cálculo de totales
- [ ] Ejecutar `pnpm test:watch`
- [ ] Ver tests pasar en verde ✅
- [ ] **Tiempo estimado**: 1-2 horas
- [ ] **Impacto**: Proteger todo el dinero del sistema 💰

---

## 🎯 Resumen Ejecutivo

| Prioridad | Módulo | Tests | Tiempo | Impacto | ROI |
|-----------|--------|-------|--------|---------|-----|
| 🔴 MÁXIMA | Cálculos dinero | 15 | 12h | CRÍTICO | 🔥🔥🔥 |
| 🔴 MÁXIMA | Facturas legales | 12 | 16h | CRÍTICO | 🔥🔥🔥 |
| 🔴 MÁXIMA | Validación identidad | 8 | 8h | CRÍTICO | 🔥🔥 |
| 🟠 ALTA | Rangos facturas | 8 | 8h | ALTO | 🔥🔥 |
| 🟠 ALTA | Totales pagos | 10 | 10h | ALTO | 🔥🔥 |
| 🟡 MEDIA | Pacientes CRUD | 10 | 8h | MEDIO | 🔥 |

**Total Estimado**: 53 tests en 62 horas (~2 semanas)
**Resultado**: Sistema de facturación confiable y legal ✅

---

¿Empezamos con el **#1 - Cálculo de Totales**? Es el más crítico y rápido de implementar. 🚀

