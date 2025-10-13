# Sistema de Precios y Variantes

## 📋 Descripción General

El sistema de precios permite gestionar productos y servicios médicos con precios base, variantes, tags (categorías) y especialidades asociadas.

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. **prices** (Precios)
Tabla principal que contiene productos y servicios.

```prisma
model Price {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        String   // "producto" o "servicio"
  basePrice   Float    // Precio base en Lempiras
  isActive    Boolean
  createdAt   DateTime
  updatedAt   DateTime
}
```

**Campos:**
- `name`: Nombre del producto/servicio (ej: "Consulta Externa")
- `description`: Descripción detallada (opcional)
- `type`: Tipo - puede ser "producto" o "servicio"
- `basePrice`: Precio base en Lempiras
- `isActive`: Estado activo/inactivo

---

#### 2. **price_variants** (Variantes de Precio)
Variantes de un precio base (ej: precio nocturno, fin de semana, etc.)

```prisma
model PriceVariant {
  id          String   @id @default(cuid())
  priceId     String
  name        String
  description String?
  price       Float
  isActive    Boolean
}
```

**Relación:** 1 Price → N PriceVariants (uno a muchos)

**Ejemplo:**
- Price: "Consulta Externa" (L. 800)
  - Variant: "Consulta Nocturna" (L. 1,200)
  - Variant: "Consulta Fin de Semana" (L. 1,000)

---

#### 3. **tags** (Tags/Categorías)
Categorías principales del sistema.

```prisma
model Tag {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
}
```

**Tags predefinidos:**
- `especialidad` - Servicios de especialidades médicas
- `hospitalizacion` - Servicios de hospitalización
- `cirugia` - Procedimientos quirúrgicos
- `rayos_x` - Servicios de radiología
- `laboratorio` - Servicios de laboratorio
- `farmacia` - Medicamentos y productos
- `emergencia` - Servicios de emergencia
- `otros` - Otros servicios

---

#### 4. **price_to_tags** (Relación Price ↔ Tag)
Tabla intermedia para la relación muchos a muchos.

**Relación:** N Prices ↔ M Tags

**Ejemplo:**
- "Rayos X de Tórax" puede tener los tags: `rayos_x` + `emergencia`

---

#### 5. **price_to_specialties** (Relación Price ↔ Specialty)
Tabla intermedia para vincular precios con especialidades.

**Regla:** Solo se usa cuando el Price tiene el tag `especialidad`

**Relación:** N Prices ↔ M Specialties

**Ejemplo:**
- "Consulta Externa" tiene tag `especialidad` y puede estar asociada a:
  - Cardiología
  - Pediatría
  - Medicina General

---

## 🎯 Casos de Uso

### Caso 1: Servicio Simple
**Producto:** Paracetamol 500mg

```javascript
{
  name: "Paracetamol 500mg",
  type: "producto",
  basePrice: 15.00,
  tags: ["farmacia"]
}
```

### Caso 2: Servicio con Variantes
**Servicio:** Rayos X de Tórax

```javascript
{
  name: "Rayos X de Tórax",
  type: "servicio",
  basePrice: 350.00,
  tags: ["rayos_x"],
  variants: [
    { name: "Nocturno", price: 500.00 },
    { name: "Fin de Semana", price: 450.00 }
  ]
}
```

### Caso 3: Servicio con Múltiples Tags
**Servicio:** Cirugía de Emergencia

```javascript
{
  name: "Cirugía de Emergencia",
  type: "servicio",
  basePrice: 15000.00,
  tags: ["cirugia", "emergencia", "hospitalizacion"]
}
```

### Caso 4: Servicio con Especialidades (Sub-tags)
**Servicio:** Consulta Externa

```javascript
{
  name: "Consulta Externa",
  type: "servicio",
  basePrice: 800.00,
  tags: ["especialidad"],
  specialties: ["Cardiología", "Pediatría", "Medicina General"]
}
```

---

## 🔄 Flujo de Operaciones

### Crear un Precio

```typescript
// 1. Usuario llena formulario
const formData = {
  name: "Consulta Externa",
  description: "Consulta médica general",
  type: "servicio",
  basePrice: 800.00,
  selectedTags: ["tag-especialidad-id"],
  selectedSpecialties: ["specialty-cardiologia-id", "specialty-pediatria-id"]
};

// 2. Se crea el precio en la BD
await prisma.price.create({
  data: {
    name: formData.name,
    description: formData.description,
    type: formData.type,
    basePrice: formData.basePrice,
    isActive: true,
    tags: {
      create: formData.selectedTags.map(tagId => ({
        tag: { connect: { id: tagId } }
      }))
    },
    specialties: {
      create: formData.selectedSpecialties.map(specialtyId => ({
        specialty: { connect: { id: specialtyId } }
      }))
    }
  }
});
```

### Agregar Variante a un Precio

```typescript
await prisma.priceVariant.create({
  data: {
    priceId: "price-id",
    name: "Nocturna",
    description: "Consulta en horario nocturno (6pm - 6am)",
    price: 1200.00,
    isActive: true
  }
});
```

---

## 📊 Consultas Comunes

### Obtener precio con todas sus relaciones

```typescript
const price = await prisma.price.findUnique({
  where: { id: priceId },
  include: {
    variants: true,
    tags: {
      include: {
        tag: true
      }
    },
    specialties: {
      include: {
        specialty: true
      }
    }
  }
});
```

### Listar precios de una categoría específica

```typescript
const prices = await prisma.price.findMany({
  where: {
    tags: {
      some: {
        tag: {
          name: "rayos_x"
        }
      }
    },
    isActive: true
  }
});
```

### Listar precios de una especialidad

```typescript
const prices = await prisma.price.findMany({
  where: {
    specialties: {
      some: {
        specialty: {
          name: "Cardiología"
        }
      }
    },
    isActive: true
  }
});
```

---

## ⚠️ Reglas de Negocio

1. **Un precio puede tener múltiples tags**
   - Ejemplo: Un servicio puede ser `rayos_x` + `emergencia`

2. **Solo los precios con tag "especialidad" pueden tener sub-tags de especialidades**
   - Si no tiene el tag "especialidad", no se vincula a ninguna specialty

3. **Las variantes pertenecen a un solo precio (1:N)**
   - No se pueden compartir variantes entre precios

4. **Los precios y variantes tienen estado activo/inactivo**
   - Permite desactivar sin eliminar

5. **Los tags son predefinidos**
   - No se crean dinámicamente desde el CRUD de precios
   - Se crean mediante seed o manualmente

---

## 🚀 Scripts de Migración

### Ejecutar migración de Prisma
```bash
pnpm prisma migrate dev --name add_price_system
```

### Seed de tags iniciales
```bash
pnpm tsx src/scripts/seed-tags.ts
```

---

## 📝 Notas de Implementación

- Los campos `description` son opcionales pero recomendados
- Los precios se almacenan en Float para soportar decimales (Lempiras)
- Las relaciones tienen `onDelete: Cascade` para mantener integridad
- El campo `type` es String pero se valida en la aplicación como enum
- Se recomienda usar transacciones al crear precios con múltiples relaciones

