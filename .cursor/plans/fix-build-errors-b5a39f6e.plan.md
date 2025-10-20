<!-- b5a39f6e-f03d-439d-8bed-70035bb20adb f154b70e-3448-4cae-b1c2-e973d2ccad5c -->
# Dashboard Multi-Role Implementation

## Objetivo

Crear dashboards personalizados con datos reales para cada rol del sistema: Admin, Caja, Recepción, Radiólogo y Especialista.

## 1. Crear API Endpoints para Estadísticas

### 1.1 API de Estadísticas del Admin

**Archivo:** `src/app/api/dashboard/admin/route.ts` (nuevo)

Endpoint GET que retorne:

- Total de pacientes registrados
- Citas del día (pendientes, confirmadas, completadas, canceladas)
- Ingresos del día/mes (total de pagos con status 'paid')
- Órdenes pendientes (radiología, consultas externas)
- Usuarios activos por rol
- Actividad reciente (últimas 10 acciones)
```typescript
// Estructura de respuesta
{
  patients: { total: number, newThisMonth: number },
  appointments: { today: { pending, confirmed, completed, cancelled }, thisWeek: number },
  revenue: { today: number, thisMonth: number },
  pendingOrders: { radiology: number, consultations: number },
  activeUsers: { byRole: Record<string, number> },
  recentActivity: Array<{ action, user, time, module }>
}
```


### 1.2 API de Estadísticas de Caja

**Archivo:** `src/app/api/dashboard/cashier/route.ts` (nuevo)

Endpoint GET que retorne:

- Total de pagos del día/semana/mes
- Desglose por método de pago (efectivo, tarjeta, transferencia) - preparar estructura aunque no tenga datos reales
- Facturas generadas (legales y simples)
- Últimas transacciones
```typescript
{
  payments: { 
    today: number, 
    thisWeek: number, 
    thisMonth: number,
    byMethod: { cash: number, card: number, transfer: number } // placeholder
  },
  invoices: { legal: number, simple: number },
  recentTransactions: Array<{ id, patient, amount, date, status }>
}
```


### 1.3 API de Estadísticas de Recepción

**Archivo:** `src/app/api/dashboard/reception/route.ts` (nuevo)

Endpoint GET que retorne:

- Citas del día (todas las especialidades)
- Total de pacientes
- Pacientes nuevos del mes
- Próximas citas de la semana
```typescript
{
  appointmentsToday: Array<{ id, patient, specialty, time, status }>,
  patients: { total: number, newThisMonth: number },
  upcomingAppointments: Array<{ date, patient, specialty, time }>
}
```


### 1.4 API de Estadísticas de Radiólogo

**Archivo:** `src/app/api/dashboard/radiologist/route.ts` (nuevo)

Endpoint GET que retorne:

- Órdenes pendientes y completadas
- Estudios más solicitados (top 5 items)
```typescript
{
  orders: { pending: number, completed: number, today: number },
  topStudies: Array<{ name: string, count: number }>,
  recentOrders: Array<{ id, patient, items, date, status }>
}
```


### 1.5 API de Estadísticas de Especialista

**Archivo:** `src/app/api/dashboard/specialist/route.ts` (nuevo)

Endpoint GET que retorne (filtrado por specialtyId del usuario):

- Citas de hoy
- Citas de los próximos 7 días
- Total de consultas completadas (mes actual)
```typescript
{
  appointmentsToday: Array<{ id, patient, time, status }>,
  appointmentsWeek: Array<{ date, patient, time, status }>,
  consultations: { thisMonth: number, completed: number }
}
```


## 2. Crear Componentes de Dashboard

### 2.1 Componente de Estadística (Card)

**Archivo:** `src/components/dashboard/StatCard.tsx` (nuevo)

Componente reutilizable para mostrar estadísticas:

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  subtitle?: string;
}
```

### 2.2 Componente de Gráfico de Tendencias

**Archivo:** `src/components/dashboard/TrendChart.tsx` (nuevo)

Usar Recharts o similar para mostrar gráficos simples de línea/barra para:

- Pagos por día (Caja)
- Citas por día (Admin/Recepción)

Instalar dependencia: `recharts` (si no está instalada)

### 2.3 Componente de Lista de Actividad Reciente

**Archivo:** `src/components/dashboard/RecentActivity.tsx` (nuevo)

Lista genérica para mostrar actividad reciente con:

- Icono según tipo
- Título
- Usuario/Paciente
- Timestamp

## 3. Implementar Dashboards por Rol

### 3.1 Refactorizar Dashboard Principal

**Archivo:** `src/app/dashboard/page.tsx`

Cambiar lógica para:

1. Detectar el rol del usuario actual
2. Renderizar el componente de dashboard correspondiente
3. Eliminar restricción de "solo admin"
```tsx
export default function DashboardPage() {
  const { user } = useAuth();
  
  if (!user) return <LoadingSpinner />;
  
  switch (user.role.name) {
    case 'admin':
      return <AdminDashboard />;
    case 'caja':
      return <CashierDashboard />;
    case 'recepcion':
      return <ReceptionDashboard />;
    case 'radiologo':
      return <RadiologistDashboard />;
    case 'especialista':
      return <SpecialistDashboard />;
    default:
      return <div>Dashboard no disponible</div>;
  }
}
```


### 3.2 Dashboard de Admin

**Archivo:** `src/components/dashboard/AdminDashboard.tsx` (nuevo)

Secciones:

- Grid de 4-6 cards con estadísticas principales
- Gráfico de citas/ingresos de la última semana
- Acciones rápidas: Gestión de Usuarios, Configuración, Administración
- Actividad reciente del sistema

### 3.3 Dashboard de Caja

**Archivo:** `src/components/dashboard/CashierDashboard.tsx` (nuevo)

Secciones:

- Cards con totales (hoy/semana/mes)
- Gráfico de tendencias de pagos
- Cards con desglose por método de pago (placeholder)
- Acciones rápidas: Nuevo Pago, Ver Pagos, Generar Factura
- Últimas transacciones

### 3.4 Dashboard de Recepción

**Archivo:** `src/components/dashboard/ReceptionDashboard.tsx` (nuevo)

Secciones:

- Cards con citas del día por estado
- Cards con estadísticas de pacientes
- Lista de citas del día
- Lista de próximas citas de la semana
- Acciones rápidas: Nueva Cita, Buscar Paciente, Nuevo Paciente

### 3.5 Dashboard de Radiólogo

**Archivo:** `src/components/dashboard/RadiologistDashboard.tsx` (nuevo)

Secciones:

- Cards con órdenes pendientes/completadas/del día
- Lista de estudios más solicitados
- Acciones rápidas: Ver Órdenes, Órdenes Pendientes
- Últimas órdenes

### 3.6 Dashboard de Especialista

**Archivo:** `src/components/dashboard/SpecialistDashboard.tsx` (nuevo)

Secciones:

- Cards con citas de hoy/semana
- Card con consultas completadas del mes
- Lista de citas de hoy
- Lista de citas de los próximos 7 días
- Acciones rápidas: Ver Citas, Consulta Externa

## 4. Tipos TypeScript

**Archivo:** `src/types/dashboard.ts` (nuevo)

Definir interfaces para:

- `AdminStats`
- `CashierStats`
- `ReceptionStats`
- `RadiologistStats`
- `SpecialistStats`

## 5. Estilos y Consistencia

Usar el sistema de diseño existente:

- Cards con `bg-white`, `border-gray-200`
- Color primario: `#2E9589`
- Iconos de `lucide-react`
- Grid responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

## Notas Importantes

1. Para el método de pago (efectivo/tarjeta/transferencia), crear estructura en la API pero retornar datos placeholder (dividir total en 3 partes iguales temporalmente)
2. Todos los queries deben usar Prisma con los modelos existentes
3. Cachear datos con `revalidate` en Next.js si es necesario
4. Manejar estados de loading con skeleton loaders
5. Todas las fechas usar formato `es-HN`
6. Los dashboards deben ser responsive (mobile-first)

### To-dos

- [ ] Crear API endpoint /api/dashboard/admin para estadísticas del administrador
- [ ] Crear API endpoint /api/dashboard/cashier para estadísticas de caja
- [ ] Crear API endpoint /api/dashboard/reception para estadísticas de recepción
- [ ] Crear API endpoint /api/dashboard/radiologist para estadísticas de radiólogo
- [ ] Crear API endpoint /api/dashboard/specialist para estadísticas de especialista
- [ ] Crear tipos TypeScript en src/types/dashboard.ts para todas las interfaces
- [ ] Crear componente reutilizable StatCard para mostrar estadísticas
- [ ] Crear componente TrendChart para gráficos de tendencias (instalar recharts si es necesario)
- [ ] Crear componente RecentActivity para mostrar actividad reciente
- [ ] Implementar AdminDashboard con estadísticas operacionales y financieras
- [ ] Implementar CashierDashboard con pagos y gráfico de tendencias
- [ ] Implementar ReceptionDashboard con citas y pacientes
- [ ] Implementar RadiologistDashboard con órdenes de radiología
- [ ] Implementar SpecialistDashboard con citas por especialidad
- [ ] Refactorizar src/app/dashboard/page.tsx para detectar rol y renderizar dashboard correspondiente