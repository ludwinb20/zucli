<!-- caabc522-48aa-4ab5-a51b-45ed3cd75264 96182921-e26c-4d63-960d-9173a50804e9 -->
# Plan: Métodos de Pago

## 1. Base de Datos

### 1.1 Actualizar Modelo Payment

En `prisma/schema.prisma`:

- Agregar campo `paymentMethod String? // "efectivo", "tarjeta", "transferencia"`
- El campo es nullable porque solo se define cuando se marca como pagado

## 2. Backend

### 2.1 Actualizar API de Generación de Facturas

En `src/app/api/invoices/generate/route.ts`:

- Agregar `paymentMethod` al body del request
- Validar que sea uno de los valores permitidos
- Actualizar el payment con el método al generar la factura
- El payment se marca como "paid" Y se guarda el método en la misma transacción

### 2.2 Actualizar GET de Payments

En `src/app/api/payments/route.ts` y `src/app/api/payments/[id]/route.ts`:

- Ya traen el campo automáticamente al hacer select del payment

## 3. Types TypeScript

### 3.1 Actualizar tipos en src/types/payments.ts

- Agregar `paymentMethod?: string | null;` a interfaz `Payment`
- Crear tipo: `export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';`

## 4. Frontend

### 4.1 PaymentDetailsModal

En `src/components/PaymentDetailsModal.tsx`:

- Agregar estado para `paymentMethod`
- Agregar selector (radio buttons o select) antes del botón "Marcar como Pagado"
- Mostrar el método si ya existe en el pago
- Pasar `paymentMethod` en el body al llamar `/api/invoices/generate`
- Validar que se haya seleccionado método antes de generar factura

### 4.2 Mostrar Método en Detalles

En `src/components/PaymentDetailsModal.tsx`:

- Si el pago está "paid", mostrar badge o texto con el método usado
- Ejemplo: "Método: Efectivo" con ícono apropiado

## 5. Validaciones

- Solo pagos con status "pendiente" muestran el selector de método
- El método es requerido para generar factura
- Una vez establecido, el método no se puede cambiar (inmutable)

## Archivos a Modificar

**Backend:**

- `prisma/schema.prisma` - agregar campo paymentMethod
- `src/app/api/invoices/generate/route.ts` - recibir y guardar método

**Types:**

- `src/types/payments.ts` - agregar PaymentMethod type

**Frontend:**

- `src/components/PaymentDetailsModal.tsx` - agregar selector y mostrar método

### To-dos

- [ ] Agregar campo paymentMethod al modelo Payment en Prisma
- [ ] Actualizar tipos TypeScript para incluir paymentMethod
- [ ] Actualizar API /invoices/generate para recibir y guardar paymentMethod
- [ ] Agregar selector de método de pago en PaymentDetailsModal
- [ ] Mostrar método de pago en detalles cuando está pagado