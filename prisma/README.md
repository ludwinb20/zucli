# 📚 Scripts de Base de Datos

Este directorio contiene los scripts de seeders y utilidades para la base de datos.

## 🚀 Comandos Disponibles

### Reset Completo (Recomendado)
Limpia **todos los datos** de la base de datos y ejecuta los seeders:

```bash
pnpm db:reset
```

Este comando:
1. ✅ Elimina todos los datos de todas las tablas
2. ✅ Ejecuta el seeder principal (`seed.ts`)
3. ✅ Ejecuta el seeder de precios (`seed-prices.ts`)
4. ✅ Muestra un resumen completo

### Seeders Individuales

#### Seeder Principal
Crea roles, especialidades, usuarios, pacientes, citas y tags:

```bash
pnpm db:seed
# o
npx tsx prisma/seed.ts
```

**Crea:**
- 4 roles (admin, especialista, caja, recepcion)
- 7 especialidades médicas
- 6 usuarios con credenciales
- 8 pacientes de ejemplo
- 8 citas médicas
- 5 tags (especialidad, hospitalizaciones, cirugias, rayos_x, otros)

#### Seeder de Precios
Crea items de servicio (medicamentos y servicios):

```bash
pnpm db:seed:prices
# o
npx tsx prisma/seed-prices.ts
```

**Crea:**
- 7 consultas por especialidad
- 12 medicamentos comunes
- 5 servicios de rayos X
- 1 servicio de hospitalización
- 3 procedimientos quirúrgicos
- 5 otros servicios médicos

**Total: ~33 service items** con sus variantes, tags y especialidades

### Otros Comandos

#### Sincronizar Schema con DB
```bash
pnpm db:push
```

#### Abrir Prisma Studio
```bash
pnpm db:studio
```

## 📋 Credenciales de Acceso

Después de ejecutar los seeders, puedes acceder con:

| Rol | Username | Password | Descripción |
|-----|----------|----------|-------------|
| Admin | `admin` | `password123` | Acceso completo al sistema |
| Especialista | `dr.martinez` | `password123` | Dr. Carlos Martínez (Cardiología) |
| Especialista | `dra.garcia` | `password123` | Dra. Ana García (Pediatría) |
| Especialista | `dr.lopez` | `password123` | Dr. Luis López (Medicina General) |
| Caja | `caja1` | `password123` | Cajero/a principal |
| Recepción | `recepcion1` | `password123` | Recepcionista principal |

## 🗂️ Estructura de Archivos

```
prisma/
├── schema.prisma          # Schema de la base de datos
├── seed.ts               # Seeder principal
├── seed-prices.ts        # Seeder de precios/servicios
├── reset-data.ts         # Script de reset completo
└── README.md            # Esta documentación
```

## ⚠️ Notas Importantes

- **`pnpm db:reset`** elimina **TODOS** los datos de la base de datos
- Use este comando solo en **desarrollo**
- En **producción**, nunca ejecute `db:reset`
- Los seeders son idempotentes (pueden ejecutarse múltiples veces)

## 🔄 Flujo de Trabajo Típico

1. **Desarrollo inicial:**
   ```bash
   pnpm db:push        # Sincronizar schema
   pnpm db:reset       # Poblar con datos de prueba
   ```

2. **Actualizar datos de prueba:**
   ```bash
   pnpm db:reset       # Limpiar y repoblar
   ```

3. **Solo actualizar precios:**
   ```bash
   pnpm db:seed:prices # Agregar más precios
   ```

## 📝 Personalización

Para modificar los datos de prueba, edita:
- `seed.ts` - Para roles, usuarios, especialidades, etc.
- `seed-prices.ts` - Para medicamentos y servicios

Luego ejecuta `pnpm db:reset` para aplicar los cambios.

