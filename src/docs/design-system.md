# Sistema de Diseño - Guía de Uso

Este documento describe cómo usar el sistema de diseño consistente para crear nuevas vistas en la aplicación.

## Componentes Principales

### 1. PageContainer
Contenedor base para todas las páginas con padding y espaciado consistente.

```tsx
import { PageContainer } from '@/components/layout/PageContainer';

<PageContainer>
  {/* Contenido de la página */}
</PageContainer>
```

### 2. PageHeader
Header estándar para páginas con título, descripción y botón de acción opcional.

```tsx
import { PageHeader } from '@/components/layout/PageHeader';

<PageHeader
  title="Gestión de Usuarios"
  description="Administra los usuarios del sistema"
  actionButton={{
    label: "Nuevo Usuario",
    onClick: handleCreateUser,
    icon: <Plus size={20} />
  }}
/>
```

### 3. DataList
Componente para mostrar listas de datos con formato consistente.

```tsx
import { DataList, DataListItem } from '@/components/common/DataList';

const items: DataListItem[] = [
  {
    id: '1',
    title: 'Juan Pérez',
    subtitle: 'juan@example.com',
    status: 'Activo',
    statusVariant: 'default',
    metadata: [
      { icon: User, label: 'Administrador' },
      { icon: Phone, label: '9999-9999' }
    ],
    actions: [
      {
        icon: Edit,
        label: 'Editar',
        onClick: () => handleEdit('1'),
        variant: 'outline'
      }
    ]
  }
];

<DataList
  title="Lista de Usuarios"
  items={items}
  emptyMessage="No se encontraron usuarios"
  emptyDescription="No hay usuarios registrados en el sistema"
  emptyIcon={Users}
  listIcon={User}
/>
```

### 4. FilterPanel
Panel de filtros reutilizable.

```tsx
import { FilterPanel, FilterField } from '@/components/common/FilterPanel';

const filterFields: FilterField[] = [
  {
    id: 'search',
    label: 'Buscar',
    type: 'text',
    value: searchTerm,
    onChange: setSearchTerm,
    placeholder: 'Buscar por nombre...'
  },
  {
    id: 'status',
    label: 'Estado',
    type: 'select',
    value: statusFilter,
    onChange: setStatusFilter,
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Inactivo' }
    ]
  }
];

<FilterPanel fields={filterFields} />
```

### 5. LoadingState
Estado de carga consistente.

```tsx
import { LoadingState } from '@/components/common/LoadingState';

<LoadingState message="Cargando usuarios..." />
```

### 6. EmptyState
Estado vacío consistente.

```tsx
import { EmptyState } from '@/components/common/EmptyState';

<EmptyState
  icon={Users}
  title="No se encontraron usuarios"
  description="No hay usuarios registrados en el sistema"
/>
```

### 7. StandardModal
Modal estándar para formularios.

```tsx
import { StandardModal } from '@/components/common/StandardModal';

<StandardModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Nuevo Usuario"
  description="Crea un nuevo usuario en el sistema"
  primaryAction={{
    label: 'Crear',
    onClick: handleSave,
    loading: isLoading
  }}
  secondaryAction={{
    label: 'Cancelar',
    onClick: () => setIsModalOpen(false)
  }}
>
  {/* Contenido del formulario */}
</StandardModal>
```

## Hook de Datos

### usePageData
Hook para manejar estado de carga y datos de páginas.

```tsx
import { usePageData } from '@/hooks/usePageData';

const { data, loading, error, refetch } = usePageData({
  fetchFunction: async () => {
    const response = await fetch('/api/users');
    return response.json();
  }
});
```

## Utilidades de Formateo

```tsx
import { 
  formatDateTime, 
  formatDate, 
  formatCurrency, 
  formatPhone,
  formatIdentityNumber,
  getInitials 
} from '@/lib/formatters';

// Formatear fecha y hora
formatDateTime(new Date()) // "25/12/2024, 14:30"

// Formatear moneda
formatCurrency(1500) // "L. 1,500.00"

// Formatear teléfono
formatPhone("99991234") // "9999-1234"

// Obtener iniciales
getInitials("Juan", "Pérez") // "JP"
```

## Clases CSS Predefinidas

```tsx
import { standardClasses } from '@/styles/design-system';

// Usar clases predefinidas
<div className={standardClasses.pageContainer}>
<div className={standardClasses.primaryButton}>
<input className={standardClasses.input} />
```

## Colores y Tokens

```tsx
import { designTokens } from '@/styles/design-system';

// Usar tokens de color
<div style={{ backgroundColor: designTokens.colors.primary }}>
<div style={{ color: designTokens.colors.gray[600] }}>
```

## Estructura de Página Típica

```tsx
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterPanel } from '@/components/common/FilterPanel';
import { DataList } from '@/components/common/DataList';
import { LoadingState } from '@/components/common/LoadingState';
import { usePageData } from '@/hooks/usePageData';

export default function UsersPage() {
  const { data, loading } = usePageData({
    fetchFunction: fetchUsers
  });

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Usuarios" description="..." />
        <LoadingState />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="Usuarios" 
        description="..." 
        actionButton={{ label: "Nuevo", onClick: handleCreate }}
      />
      
      <FilterPanel fields={filterFields} />
      
      <DataList
        title="Lista de Usuarios"
        items={data}
        emptyMessage="No se encontraron usuarios"
        emptyIcon={Users}
        listIcon={User}
      />
    </PageContainer>
  );
}
```

## Mejores Prácticas

1. **Siempre usar PageContainer** como contenedor base
2. **Usar PageHeader** para el encabezado de la página
3. **Usar DataList** en lugar de tablas para listas de datos
4. **Usar FilterPanel** para filtros de búsqueda
5. **Usar StandardModal** para formularios
6. **Usar LoadingState y EmptyState** para estados especiales
7. **Usar usePageData** para manejar datos y estado de carga
8. **Usar formatters** para formatear datos consistentemente
9. **Usar standardClasses** para estilos consistentes
10. **Seguir la estructura típica** de página mostrada arriba

Este sistema asegura que todas las vistas tengan una apariencia y comportamiento consistente.

