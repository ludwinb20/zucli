# 🏗️ Arquitectura de Transacciones

## 📋 Resumen

Este sistema utiliza una **tabla universal de items** (`transaction_items`) que elimina la duplicación de datos y permite agregar nuevos módulos fácilmente.

---

## 🎯 Principio Fundamental

### **Single Source of Truth para Items**

```
❌ ANTES: Items duplicados
- ConsultationItem (lo aplicado)
- PaymentItem (lo cobrado)  
- InvoiceItem (lo facturado)
= MISMO ITEM GUARDADO 3 VECES 😱

✅ AHORA: Un solo item
- TransactionItem (única fuente de verdad)
= ITEM GUARDADO 1 SOLA VEZ ✨
```

---

## 📊 Estructura de Datos

### **1. TransactionItem (Tabla Universal)**

```prisma
model TransactionItem {
  sourceType    String  // "consultation", "sale", "hospitalization", "surgery"
  sourceId      String  // ID del módulo origen
  
  serviceItemId String  // Qué se vendió/aplicó
  variantId     String? // Variante específica
  quantity      Int
  
  // Snapshot (precio en el momento)
  nombre         String
  precioUnitario Float
  descuento      Float
  total          Float
}
```

### **2. Módulos (Fuentes de Transacciones)**

```
Consultation  → TransactionItems (sourceType: "consultation")
Sale          → TransactionItems (sourceType: "sale")
Hospitalization → TransactionItems (sourceType: "hospitalization")
Surgery (futuro) → TransactionItems (sourceType: "surgery")
```

### **3. Payment (Sin Items Propios)**

```prisma
model Payment {
  // Referencia a la fuente (solo una debe estar presente)
  consultationId    String?
  saleId            String?
  hospitalizationId String?
  
  total Float
  
  // ❌ NO tiene items
  // Los items vienen de consultation/sale/hospitalization
}
```

### **4. Invoice (Sin Items Propios)**

```prisma
model Invoice {
  paymentId String
  type      String  // "legal" o "simple"
  
  numeroDocumento String
  total           Float
  
  // ❌ NO tiene items
  // Los items se obtienen de payment → source → items
}
```

---

## 🔄 Flujos de Trabajo

### **Caso 1: Consulta Médica** 👨‍⚕️

```typescript
// 1. Doctor crea consulta
POST /api/consultations
{
  patientId: "...",
  doctorId: "...",
  items: [
    {
      serviceItemId: "consulta-cardiologia",
      quantity: 1,
      nombre: "Consulta Cardiología",
      precioUnitario: 500,
      total: 500
    }
  ]
}

// Sistema crea:
// a) Consultation
// b) TransactionItems (sourceType: "consultation")
// c) Payment (consultationId: ...)

// 2. Caja factura
POST /api/invoices
{
  paymentId: "...",
  type: "legal",
  clienteRTN: "..."
}

// Sistema crea:
// - Invoice (type: "legal")
// - Obtiene items de: payment.consultation → TransactionItems
```

---

### **Caso 2: Venta Directa (Sin Consulta)** 💊

```typescript
// 1. Caja registra venta
POST /api/sales
{
  patientId: "..." (opcional),
  cashierId: "...",
  items: [
    {
      serviceItemId: "paracetamol",
      quantity: 2,
      nombre: "Paracetamol 500mg",
      precioUnitario: 20,
      total: 40
    }
  ]
}

// Sistema crea:
// a) Sale
// b) TransactionItems (sourceType: "sale")
// c) Payment (saleId: ...)

// 2. Factura inmediata
POST /api/invoices
{
  paymentId: "...",
  type: "simple"
}

// Obtiene items de: payment.sale → TransactionItems
```

---

### **Caso 3: Hospitalización** 🏥

```typescript
// 1. Admisión del paciente
POST /api/hospitalizations
{
  patientId: "...",
  doctorId: "...",
  roomNumber: "301",
  items: [
    {
      serviceItemId: "habitacion-privada",
      quantity: 5, // 5 días
      nombre: "Habitación Privada",
      precioUnitario: 800,
      total: 4000
    }
  ]
}

// 2. Agregar servicios diarios
POST /api/hospitalizations/{id}/items
{
  serviceItemId: "medicamento-iv",
  quantity: 3,
  nombre: "Antibiótico IV",
  precioUnitario: 150,
  total: 450
}

// 3. Al dar de alta
PUT /api/hospitalizations/{id}
{
  status: "discharged",
  dischargeDate: "2025-10-15"
}

// 4. Generar pago total
POST /api/payments (automático o manual)
// Payment (hospitalizationId: ...)

// 5. Facturar
POST /api/invoices
// Obtiene items de: payment.hospitalization → TransactionItems
```

---

### **Caso 4: Cirugía (Futuro)** ⚕️

```typescript
// Similar a Hospitalización
POST /api/surgeries
{
  patientId: "...",
  surgeonId: "...",
  surgeryType: "Apendicectomía",
  items: [
    { serviceItemId: "cirugia-apendice", ... },
    { serviceItemId: "anestesia-general", ... },
    { serviceItemId: "quirofano-2h", quantity: 2, ... }
  ]
}

// Payment (surgeryId: ...)
// Invoice → payment.surgery → TransactionItems
```

---

## 🔍 Queries Comunes

### **Obtener Items de un Pago**

```typescript
const payment = await prisma.payment.findUnique({
  where: { id: paymentId },
  include: {
    consultation: true,
    sale: true,
    hospitalization: true,
  }
});

// Determinar fuente
let sourceType, sourceId;
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

// Obtener items
const items = await prisma.transactionItem.findMany({
  where: { sourceType, sourceId },
  include: {
    serviceItem: true,
    variant: true,
  }
});
```

### **Helper Function (Recomendado)**

```typescript
import { getPaymentItems } from '@/lib/transaction-helpers';

const items = await getPaymentItems(prisma, paymentId);
```

---

## 📈 Ventajas de Esta Arquitectura

### **1. Cero Duplicación** ✅
- Cada item se guarda 1 sola vez
- Ahorro de ~70% de espacio en disco
- Consistencia garantizada

### **2. Escalabilidad** ✅
- Agregar nuevo módulo = 3 líneas de código
- Cirugías, laboratorios, terapias, etc.
- Sin modificar tablas existentes

### **3. Flexibilidad** ✅
- Ventas con o sin paciente
- Múltiples fuentes en un solo pago (futuro)
- Pagos parciales

### **4. Trazabilidad** ✅
- Desde factura → pago → fuente → items
- Auditorías claras
- Historial completo

### **5. Simplicidad** ✅
- Menos tablas = menos código
- Menos bugs potenciales
- Más fácil de mantener

---

## 🚀 Agregar Nuevos Módulos

### **Template para Nuevo Módulo:**

1. **Crear modelo en schema.prisma:**
   ```prisma
   model NuevoModulo {
     id        String   @id @default(cuid())
     patientId String
     // ... campos específicos
     
     patient  Patient  @relation(...)
     payments Payment[]
     
     @@map("nuevo_modulo")
   }
   ```

2. **Agregar relación en Payment:**
   ```prisma
   model Payment {
     // ... campos existentes
     nuevoModuloId String?
     nuevoModulo   NuevoModulo? @relation(...)
   }
   ```

3. **Crear API:**
   ```typescript
   POST /api/nuevo-modulo
   // Crea módulo + TransactionItems (sourceType: "nuevo_modulo")
   // Crea Payment (nuevoModuloId: ...)
   ```

4. **Listo!** 🎉

---

## 📝 Notas Importantes

- **Snapshot:** Los items guardan nombre y precio en el momento de la transacción
- **Inmutabilidad:** Una vez creado, un TransactionItem no debería modificarse
- **Descuentos:** Se pueden aplicar a nivel de item o de pago/factura
- **Auditoría:** Cada item tiene `addedBy` para saber quién lo agregó

---

## 🔄 Migración desde Sistema Anterior

Si ya tienes datos:
1. Crear TransactionItems desde ConsultationItems
2. Crear TransactionItems desde PaymentItems  
3. Actualizar Payments para referenciar fuentes
4. Eliminar tablas antiguas de items

(Ver script de migración en `prisma/migrations/`)

---

## 💡 Mejores Prácticas

1. **Siempre crear items con snapshot completo:**
   ```typescript
   {
     nombre: "Nombre completo",
     precioUnitario: precio_en_el_momento,
     total: precio * cantidad - descuento
   }
   ```

2. **Validar fuente antes de crear items:**
   ```typescript
   const sourceExists = await prisma[sourceType].findUnique({
     where: { id: sourceId }
   });
   ```

3. **Usar helpers para obtener items:**
   ```typescript
   import { getPaymentItems } from '@/lib/transaction-helpers';
   ```

4. **Un pago = una fuente** (por ahora)
   - Futuro: múltiples fuentes con tabla intermedia

---

## 📚 Referencias

- Schema: `prisma/schema.prisma`
- Tipos: `src/types/transactions.ts`
- Helpers: `src/lib/transaction-helpers.ts`
- API Consultations: `src/app/api/consultations/route.ts`
- API Sales: `src/app/api/sales/route.ts`
- API Payments: `src/app/api/payments/route.ts`

