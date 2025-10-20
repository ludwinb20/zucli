# 🏥 Módulo de Radiología - Implementación Completa

**Fecha**: 14 de Octubre, 2025  
**Estado**: ✅ **BACKEND COMPLETADO**

---

## 📋 Resumen

Se ha implementado el módulo completo de radiología con el siguiente flujo:

**FLUJO DE TRABAJO:**
1. 💰 **Caja** → Cobra al paciente y crea pago de tipo `radiology`
2. 🔄 **Sistema** → Automáticamente crea `RadiologyOrder` vinculada al pago
3. 👨‍⚕️ **Radiólogo** → Ve órdenes pendientes en su panel
4. 📋 **Radiólogo** → Realiza estudio, registra hallazgos y diagnóstico
5. ✅ **Radiólogo** → Marca como completado y sube imágenes (opcional)

---

## ✅ Cambios Realizados

### 1. **Schema de Base de Datos** ✅

**Archivo**: `prisma/schema.prisma`

#### Nuevo Modelo: `RadiologyOrder`

```prisma
model RadiologyOrder {
  id              String   @id @default(cuid())
  patientId       String
  paymentId       String   @unique // Relación 1:1 con Payment
  
  // Estado de la orden
  status          String   @default("pending") // pending, in_progress, completed, cancelled
  
  // Resultados y observaciones
  findings        String?  @db.Text // Hallazgos radiológicos
  diagnosis       String?  @db.Text // Impresión diagnóstica
  images          String?  @db.Text // JSON con URLs de imágenes subidas
  performedBy     String?  // ID del radiólogo que realizó el estudio
  
  // Metadata
  notes           String?  @db.Text // Notas adicionales
  completedAt     DateTime? // Fecha de finalización del estudio
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relaciones
  patient         Patient  @relation(fields: [patientId], references: [id])
  payment         Payment  @relation(fields: [paymentId], references: [id])
  
  @@map("radiology_orders")
}
```

#### Relaciones Actualizadas:

**`Payment`** → Agregado:
```prisma
radiologyOrder  RadiologyOrder?  // Nueva relación con órdenes de radiología
```

**`Patient`** → Agregado:
```prisma
radiologyOrders  RadiologyOrder[] // Órdenes de radiología del paciente
```

---

### 2. **TypeScript Types** ✅

**Archivo**: `src/types/radiology.ts` (NUEVO)

```typescript
export type RadiologyOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface RadiologyOrder {
  id: string;
  patientId: string;
  paymentId: string;
  status: RadiologyOrderStatus;
  findings?: string | null;
  diagnosis?: string | null;
  images?: string | null;
  performedBy?: string | null;
  notes?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RadiologyOrderWithRelations extends RadiologyOrder {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
    birthDate: Date;
    gender: string;
  };
  payment: {
    id: string;
    total: number;
    status: string;
    createdAt: Date;
  };
  performer?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateRadiologyOrderData {
  patientId: string;
  paymentId: string;
  notes?: string;
}

export interface UpdateRadiologyOrderData {
  status?: RadiologyOrderStatus;
  findings?: string;
  diagnosis?: string;
  images?: string;
  performedBy?: string;
  notes?: string;
  completedAt?: Date | string;
}
```

**Archivo**: `src/types/payments.ts` (MODIFICADO)

```typescript
// Agregado tipo de pago
export type PaymentSourceType = 'consultation' | 'sale' | 'hospitalization' | 'radiology';

// Agregado parámetro type
export interface CreatePaymentData {
  patientId: string;
  items: CreatePaymentItemData[];
  notes?: string;
  type?: 'sale' | 'radiology'; // NUEVO
}
```

**Archivo**: `src/types/index.ts` (MODIFICADO)

```typescript
// Exportados tipos de radiología
export type {
  RadiologyOrderStatus,
  RadiologyOrder,
  RadiologyOrderWithRelations,
  CreateRadiologyOrderData,
  UpdateRadiologyOrderData,
  RadiologyOrderListItem,
  RadiologyOrderModalProps,
  RadiologyResultsModalProps
} from './radiology';
```

---

### 3. **API Endpoints** ✅

#### **GET `/api/radiology`** - Listar órdenes de radiología

**Parámetros de query**:
- `patientId` (opcional): Filtrar por paciente
- `status` (opcional): Filtrar por estado
- `search` (opcional): Buscar por nombre/identidad de paciente
- `page` (opcional, default: 1): Página actual
- `limit` (opcional, default: 20): Registros por página

**Respuesta**:
```json
{
  "orders": [
    {
      "id": "...",
      "patientId": "...",
      "paymentId": "...",
      "status": "pending",
      "createdAt": "...",
      "patient": { "firstName": "...", "lastName": "..." },
      "payment": { "total": 500, "status": "pendiente" }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 50,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "limit": 20
  }
}
```

---

#### **POST `/api/radiology`** - Crear orden de radiología

**Nota**: Normalmente NO se usa directamente, se crea automáticamente desde pagos.

**Body**:
```json
{
  "patientId": "...",
  "paymentId": "...",
  "notes": "Orden manual"
}
```

---

#### **GET `/api/radiology/[id]`** - Obtener orden específica

**Respuesta**:
```json
{
  "id": "...",
  "patientId": "...",
  "paymentId": "...",
  "status": "pending",
  "findings": null,
  "diagnosis": null,
  "images": null,
  "performedBy": null,
  "notes": "...",
  "completedAt": null,
  "createdAt": "...",
  "patient": {
    "id": "...",
    "firstName": "Juan",
    "lastName": "Pérez",
    "identityNumber": "0801-1990-12345",
    "phone": "98765432"
  },
  "payment": {
    "id": "...",
    "total": 500,
    "status": "pendiente"
  }
}
```

---

#### **PATCH `/api/radiology/[id]`** - Actualizar orden

**Body** (todos opcionales):
```json
{
  "status": "in_progress",
  "findings": "Campos pulmonares despejados...",
  "diagnosis": "Radiografía de tórax normal",
  "images": "[{\"url\": \"...\", \"type\": \"rayos_x\"}]",
  "notes": "Notas adicionales"
}
```

**Lógica automática**:
- Si `status === 'completed'`:
  - Guarda `completedAt = now()`
  - Guarda `performedBy = session.user.id`
- Si se agregan `findings`, `diagnosis` o `images` y estado es `pending`:
  - Cambia automáticamente a `in_progress`
  - Guarda `performedBy = session.user.id`

---

#### **DELETE `/api/radiology/[id]`** - Cancelar orden

**Validaciones**:
- ❌ No permite cancelar órdenes `completed`
- ✅ Cambia estado a `cancelled`

---

#### **POST `/api/payments`** - MODIFICADO para radiología

**Body** (agregado campo `type`):
```json
{
  "patientId": "...",
  "items": [
    {
      "priceId": "...",
      "nombre": "Rayos X de Tórax",
      "precioUnitario": 500,
      "quantity": 1
    }
  ],
  "type": "radiology",  // ← NUEVO: "sale" o "radiology"
  "notes": "Orden de rayos x"
}
```

**Lógica automática**:
1. Crea el `Payment` normal
2. **SI `type === 'radiology'`**:
   - Crea automáticamente `RadiologyOrder` vinculada
   - Estado inicial: `pending`
   - Devuelve la orden en la respuesta

**Respuesta**:
```json
{
  "id": "payment-id",
  "patientId": "...",
  "saleId": "...",
  "total": 500,
  "status": "pendiente",
  "items": [...],
  "radiologyOrder": {  // ← NUEVO: Solo si type === "radiology"
    "id": "order-id",
    "patientId": "...",
    "paymentId": "payment-id",
    "status": "pending",
    "createdAt": "..."
  }
}
```

---

## 🔄 Flujo Completo de Uso

### 1. **Caja: Crear Pago de Radiología**

```typescript
// Desde el módulo de pagos/caja
const response = await fetch('/api/payments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patientId: 'patient-123',
    items: [
      {
        priceId: 'price-rayosx',
        nombre: 'Rayos X de Tórax PA y Lateral',
        precioUnitario: 500,
        quantity: 1
      }
    ],
    type: 'radiology', // ← IMPORTANTE
    notes: 'Orden de rayos x de tórax'
  })
});

const data = await response.json();
// data.radiologyOrder.id → ID de la orden creada automáticamente
```

---

### 2. **Radiólogo: Ver Órdenes Pendientes**

```typescript
// Desde el módulo de radiología
const response = await fetch('/api/radiology?status=pending');
const { orders, pagination } = await response.json();

// Mostrar lista de órdenes pendientes
orders.forEach(order => {
  console.log(`Paciente: ${order.patient.firstName} ${order.patient.lastName}`);
  console.log(`Total pagado: L ${order.payment.total}`);
  console.log(`Estado: ${order.status}`);
});
```

---

### 3. **Radiólogo: Iniciar Estudio**

```typescript
// Cuando el radiólogo empieza a trabajar en la orden
const response = await fetch(`/api/radiology/${orderId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    findings: 'Iniciando estudio...',
    // Al agregar findings, status cambia automáticamente a "in_progress"
  })
});
```

---

### 4. **Radiólogo: Completar Estudio**

```typescript
// Cuando termina el estudio
const response = await fetch(`/api/radiology/${orderId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'completed',
    findings: `
      HALLAZGOS:
      - Campos pulmonares despejados
      - Silueta cardíaca normal
      - Sin infiltrados ni consolidaciones
    `,
    diagnosis: 'Radiografía de tórax PA y Lateral: SIN ALTERACIONES',
    images: JSON.stringify([
      { url: '/uploads/xray-123-pa.jpg', type: 'PA' },
      { url: '/uploads/xray-123-lateral.jpg', type: 'Lateral' }
    ])
  })
});

// El sistema automáticamente guarda:
// - completedAt: now()
// - performedBy: session.user.id
```

---

## 📊 Estados de Órdenes

| Estado | Descripción | Puede cambiar a |
|--------|-------------|-----------------|
| **pending** | Orden creada, esperando atención | `in_progress`, `cancelled` |
| **in_progress** | Radiólogo trabajando en el estudio | `completed`, `cancelled` |
| **completed** | Estudio completado con resultados | ❌ (final) |
| **cancelled** | Orden cancelada | ❌ (final) |

---

## 🎨 Frontend Pendiente

### Componentes a Crear:

1. **Módulo de Caja - Actualizado**
   ```tsx
   // Agregar opción para seleccionar tipo de pago
   <Select value={paymentType} onChange={setPaymentType}>
     <option value="sale">Venta Normal</option>
     <option value="radiology">Rayos X / Radiología</option>
   </Select>
   ```

2. **Página de Radiología** (`/radiologia`)
   ```tsx
   // src/app/radiologia/page.tsx
   - Lista de órdenes pendientes
   - Filtros por estado
   - Búsqueda por paciente
   ```

3. **Modal de Resultados de Radiología**
   ```tsx
   // src/components/RadiologyResultsModal.tsx
   - Formulario para ingresar hallazgos
   - Campo de diagnóstico
   - Subida de imágenes
   - Botón para marcar como completado
   ```

4. **Vista Detallada de Orden**
   ```tsx
   // src/app/radiologia/[id]/page.tsx
   - Información del paciente
   - Detalles del pago
   - Formulario de resultados
   - Galería de imágenes
   ```

---

## 🔐 Permisos y Seguridad

### Roles con Acceso:

| Rol | Ver Órdenes | Crear Pago Radiología | Actualizar Orden | Completar Estudio |
|-----|-------------|----------------------|------------------|-------------------|
| **admin** | ✅ | ✅ | ✅ | ✅ |
| **radiologo** | ✅ | ❌ | ✅ | ✅ |
| **caja** | ❌ | ✅ | ❌ | ❌ |
| **especialista** | ❌ | ❌ | ❌ | ❌ |
| **recepcion** | ❌ | ❌ | ❌ | ❌ |

---

## 📁 Archivos Creados/Modificados

```
zucli/
├── prisma/
│   └── schema.prisma                          ✏️ MODIFICADO (agregado RadiologyOrder)
│
├── src/
│   ├── types/
│   │   ├── radiology.ts                       ✅ NUEVO
│   │   ├── payments.ts                        ✏️ MODIFICADO (agregado type)
│   │   └── index.ts                           ✏️ MODIFICADO (exportar radiology)
│   │
│   ├── app/api/
│   │   ├── radiology/
│   │   │   ├── route.ts                       ✅ NUEVO (GET, POST)
│   │   │   └── [id]/
│   │   │       └── route.ts                   ✅ NUEVO (GET, PATCH, DELETE)
│   │   └── payments/
│   │       └── route.ts                       ✏️ MODIFICADO (lógica radiología)
│   │
│   └── (frontend pendiente)
│       ├── app/radiologia/page.tsx            ⏳ PENDIENTE
│       ├── app/radiologia/[id]/page.tsx       ⏳ PENDIENTE
│       └── components/
│           ├── RadiologyOrdersList.tsx        ⏳ PENDIENTE
│           ├── RadiologyResultsModal.tsx      ⏳ PENDIENTE
│           └── RadiologyOrderCard.tsx         ⏳ PENDIENTE
│
└── RADIOLOGY_MODULE_IMPLEMENTATION.md         ✅ NUEVO (este archivo)
```

---

## 🚀 Próximos Pasos

### **Prioridad Alta** (2-3 horas):

1. **✅ Crear interfaz de Caja**
   - Agregar selector de tipo de pago ("Venta" / "Radiología")
   - Mostrar confirmación cuando se crea orden de radiología
   - Tiempo: 30 min

2. **✅ Crear página de Radiología** (`/radiologia`)
   - Lista de órdenes con filtros
   - Estados visuales (pending, in_progress, completed)
   - Búsqueda de pacientes
   - Tiempo: 1 hora

3. **✅ Crear Modal de Resultados**
   - Formulario para hallazgos y diagnóstico
   - Textarea para findings
   - Textarea para diagnosis
   - Botón "Marcar como Completado"
   - Tiempo: 45 min

4. **✅ Agregar a Navegación**
   - Agregar "Radiología" al menú del radiólogo
   - Ícono: `<Scan size={20} />`
   - Tiempo: 15 min

---

### **Prioridad Media** (1-2 horas):

5. **Subida de Imágenes**
   - Integrar con storage (S3, Cloudinary, etc.)
   - Galería de imágenes en resultados
   - Visor de imágenes radiológicas
   - Tiempo: 2 horas

6. **Dashboard de Radiólogo**
   - Estadísticas de estudios
   - Órdenes pendientes del día
   - Tiempo promedio por estudio
   - Tiempo: 1 hora

---

### **Prioridad Baja** (mejoras futuras):

7. **Plantillas de Informes**
   - Templates predefinidos por tipo de estudio
   - Autocompletado de campos comunes
   - Tiempo: 1 hora

8. **Notificaciones**
   - Notificar al radiólogo cuando hay nueva orden
   - Notificar al especialista cuando se completa
   - Tiempo: 1 hora

9. **Reportes y Estadísticas**
   - Estudios por período
   - Estudios por radiólogo
   - Tiempos de respuesta
   - Tiempo: 2 horas

---

## 🎓 Comandos de Desarrollo

### Verificar schema:
```bash
pnpm db:push
```

### Ejecutar tests:
```bash
pnpm test
```

### Generar cliente Prisma:
```bash
npx prisma generate
```

---

## ✅ Checklist de Implementación

### Backend:
- [x] Modelo `RadiologyOrder` en schema
- [x] Relaciones en `Patient` y `Payment`
- [x] Migración de base de datos
- [x] Tipos TypeScript
- [x] API `/api/radiology` (GET, POST)
- [x] API `/api/radiology/[id]` (GET, PATCH, DELETE)
- [x] Modificar `/api/payments` para radiología
- [x] Lógica automática de creación de órdenes

### Frontend:
- [ ] **Actualizar módulo de Caja**
- [ ] **Crear página `/radiologia`**
- [ ] **Crear componentes de radiología**
- [ ] **Agregar a navegación**
- [ ] **Subida de imágenes**
- [ ] **Dashboard de radiólogo**

---

## 🎉 Conclusión

El **backend del módulo de radiología está 100% completo** y listo para usar.

**✅ Implementado:**
- Base de datos con `RadiologyOrder`
- APIs completas para CRUD
- Creación automática desde pagos
- Estados y transiciones
- Type-safety completo

**⏳ Siguiente paso:**
Crear la interfaz de usuario (frontend) para que caja y radiólogos puedan usar el sistema.

---

*Generado el 14 de Octubre, 2025*

