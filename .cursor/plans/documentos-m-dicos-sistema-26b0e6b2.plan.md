<!-- 26b0e6b2-a066-44fc-8e93-8ef0da9521ba df8b8b63-561c-4d1f-b30a-dd992bdcd2ba -->
# Sistema de Documentos Médicos

## 1. Base de Datos

### 1.1 Crear modelo MedicalDocument en `prisma/schema.prisma`

Agregar al modelo Patient la relación:

```prisma
medicalDocuments MedicalDocument[]
```

Crear nuevo modelo:

```prisma
model MedicalDocument {
  id          String   @id @default(cuid())
  patientId   String
  issuedBy    String   // userId del doctor que emite
  documentType String  // "constancia", "incapacidad", "orden_examen"
  
  // Campos específicos por tipo
  constancia  String?  @db.Text // Solo para constancias
  diagnostico String?  @db.Text // Para incapacidades
  diasReposo  Int?     // Para incapacidades
  fechaInicio DateTime? // Para incapacidades
  fechaFin    DateTime? // Para incapacidades (calculada: fechaInicio + diasReposo)
  tipoExamen  String?  // Para órdenes de examen
  indicaciones String? @db.Text // Para órdenes de examen
  urgencia    String?  // Para órdenes: "normal", "urgente"
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  patient     Patient  @relation(fields: [patientId], references: [id])
  issuer      User     @relation(fields: [issuedBy], references: [id])
  
  @@index([patientId])
  @@index([issuedBy])
  @@map("medical_documents")
}
```

Agregar al modelo User:

```prisma
medicalDocuments MedicalDocument[] @relation("medical_documents")
```

## 2. Types TypeScript

### 2.1 Crear `src/types/medical-documents.ts`

```typescript
export type DocumentType = 'constancia' | 'incapacidad' | 'orden_examen';
export type Urgencia = 'normal' | 'urgente';

export interface MedicalDocument {
  id: string;
  patientId: string;
  issuedBy: string;
  documentType: DocumentType;
  constancia?: string | null;
  diagnostico?: string | null;
  diasReposo?: number | null;
  fechaInicio?: Date | string | null;
  fechaFin?: Date | string | null;
  tipoExamen?: string | null;
  indicaciones?: string | null;
  urgencia?: Urgencia | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MedicalDocumentWithRelations extends MedicalDocument {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
    birthDate: Date | string;
  };
  issuer: {
    id: string;
    name: string;
  };
}

export interface CreateConstanciaData {
  patientId: string;
  constancia: string;
}

export interface CreateIncapacidadData {
  patientId: string;
  diagnostico: string;
  diasReposo: number;
  fechaInicio: string; // ISO date
}

export interface CreateOrdenExamenData {
  patientId: string;
  tipoExamen: string;
  indicaciones: string;
  urgencia: Urgencia;
}

export type CreateMedicalDocumentData = 
  | CreateConstanciaData 
  | CreateIncapacidadData 
  | CreateOrdenExamenData;
```

## 3. Backend API

### 3.1 Crear `src/app/api/medical-documents/route.ts`

```typescript
// GET - Obtener documentos (filtrar por patientId query param)
// POST - Crear nuevo documento
```

Validaciones:

- Verificar que el usuario sea doctor/especialista
- Validar campos según tipo de documento
- Calcular fechaFin para incapacidades (fechaInicio + diasReposo días)

### 3.2 Crear `src/app/api/medical-documents/[id]/route.ts`

```typescript
// GET - Obtener documento específico
// DELETE - Eliminar documento (solo admin)
```

### 3.3 Crear `src/app/api/medical-documents/[id]/pdf/route.ts`

```typescript
// GET - Generar y devolver PDF del documento
```

Permisos de reimpresión: doctores, recepción y admin

## 4. Librería PDF

### 4.1 Instalar dependencia

```bash
pnpm add jspdf
```

### 4.2 Crear `src/lib/pdf-generator.ts`

Funciones para generar PDFs:

```typescript
export function generateConstanciaPDF(doc: MedicalDocumentWithRelations): Blob
export function generateIncapacidadPDF(doc: MedicalDocumentWithRelations): Blob
export function generateOrdenExamenPDF(doc: MedicalDocumentWithRelations): Blob
```

Formato del PDF:

- Encabezado con logo y datos del hospital
- Datos del paciente (nombre, identidad, edad)
- Contenido del documento según tipo
- Espacio para firma y sello del doctor
- Fecha de emisión
- Pie con nombre del doctor emisor

## 5. Frontend - Modal de Emisión

### 5.1 Crear `src/components/MedicalDocumentModal.tsx`

Props:

```typescript
interface MedicalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSuccess: () => void;
}
```

Contenido del modal:

- Selector de tipo de documento (tabs o select)
- Formularios específicos según tipo:
  - **Constancia**: Textarea para contenido libre
  - **Incapacidad**: Campo diagnóstico, selector de días de reposo (1-30), date picker para fecha inicio
  - **Orden de Examen**: Input tipo de examen, textarea indicaciones, radio buttons urgencia (normal/urgente)
- Botón "Generar y Descargar" que crea el documento y descarga PDF
- Botón "Cancelar"

## 6. Integración en Módulos

### 6.1 Vista de Consulta Externa `src/app/consulta-externa/[id]/page.tsx`

Agregar botón "Emitir Documento" en la sección de acciones:

```tsx
<Button onClick={() => setShowMedicalDocModal(true)}>
  <FileText className="h-4 w-4 mr-2" />
  Emitir Documento
</Button>
```

### 6.2 Vista de Hospitalización `src/app/hospitalizaciones/[id]/page.tsx`

Agregar botón similar en el header de acciones

### 6.3 Vista de Cirugía `src/app/surgeries/[id]/page.tsx`

Agregar botón similar en el header de acciones

## 7. Historial en Perfil de Paciente

### 7.1 Modificar `src/app/patients/page.tsx`

Agregar nueva sección "Documentos Médicos" en la vista de listado de pacientes:

- Al hacer clic en un paciente, mostrar modal o redirigir a vista de detalle
- Botón "Ver Documentos" en el menú de acciones de cada paciente

### 7.2 Crear componente `src/components/PatientDocumentsSection.tsx`

Mostrar:

- Lista de documentos emitidos ordenados por fecha (más reciente primero)
- Card por cada documento con:
  - Tipo de documento (badge con color)
  - Fecha de emisión
  - Doctor emisor
  - Resumen del contenido (primeras líneas)
  - Botón "Reimprimir" (genera y descarga PDF nuevamente)
- Filtros por tipo de documento
- Búsqueda por contenido

## 8. Permisos y Validaciones

### 8.1 Middleware de permisos

En API routes:

- **Crear documento**: Solo roles `especialista` y doctores con `role.name` que incluya "doctor"
- **Ver/listar documentos**: Todos los roles autenticados
- **Reimprimir PDF**: Roles `especialista`, `recepcion`, `admin`
- **Eliminar documento**: Solo `admin`

### 8.2 Validaciones frontend

- Deshabilitar botón "Emitir Documento" si el usuario no es doctor
- Mostrar botón "Reimprimir" solo a usuarios con permisos
- Validar campos requeridos antes de enviar

## 9. Archivos a Crear/Modificar

**Nuevos:**

- `prisma/schema.prisma` - modelo MedicalDocument
- `src/types/medical-documents.ts` - tipos TypeScript
- `src/app/api/medical-documents/route.ts` - CRUD endpoints
- `src/app/api/medical-documents/[id]/route.ts` - endpoint por ID
- `src/app/api/medical-documents/[id]/pdf/route.ts` - generación PDF
- `src/lib/pdf-generator.ts` - funciones generación PDF
- `src/components/MedicalDocumentModal.tsx` - modal de emisión
- `src/components/PatientDocumentsSection.tsx` - sección de documentos

**Modificar:**

- `src/app/consulta-externa/[id]/page.tsx` - agregar botón
- `src/app/hospitalizaciones/[id]/page.tsx` - agregar botón
- `src/app/surgeries/[id]/page.tsx` - agregar botón
- `src/app/patients/page.tsx` - agregar acceso a documentos

## 10. Flujo de Uso

1. Doctor entra a consulta/hospitalización/cirugía
2. Click en "Emitir Documento"
3. Selecciona tipo de documento
4. Llena formulario según tipo
5. Click "Generar y Descargar"
6. Se crea registro en BD y se descarga PDF
7. El documento queda guardado en historial del paciente
8. Cualquier usuario autorizado puede reimprimir desde el historial

### To-dos

- [ ] Crear modelo MedicalDocument en Prisma schema y ejecutar migración
- [ ] Crear tipos TypeScript para documentos médicos
- [ ] Crear API endpoints para CRUD de documentos médicos
- [ ] Instalar jspdf y crear funciones de generación de PDFs
- [ ] Crear MedicalDocumentModal con formularios para cada tipo
- [ ] Integrar botón en vista de consulta externa
- [ ] Integrar botón en vista de hospitalización
- [ ] Integrar botón en vista de cirugía
- [ ] Crear sección de historial de documentos en vista de paciente
- [ ] Implementar validaciones de permisos en API y frontend