'use client';

import React, { useState } from 'react';
import { Plus, Edit, Trash2, User, Phone, Mail } from 'lucide-react';
import { usePageData } from '@/hooks/usePageData';
import { formatDateTime, formatPhone } from '@/lib/formatters';
import { 
  PageContainer, 
  PageHeader, 
  FilterPanel, 
  DataList, 
  LoadingState,
  DataListItem,
  FilterField
} from '@/components';

// Ejemplo de cómo usar el nuevo sistema de diseño
export default function UsersPageExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Hook personalizado para manejar datos
  const { data: users, loading, error, refetch } = usePageData({
    fetchFunction: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Error al cargar usuarios');
      return response.json();
    }
  });

  // Configuración de filtros
  const filterFields: FilterField[] = [
    {
      id: 'search',
      label: 'Buscar',
      type: 'text',
      value: searchTerm,
      onChange: setSearchTerm,
      placeholder: 'Buscar por nombre o email...'
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

  // Filtrar usuarios
  const filteredUsers = users?.filter((user: { name: string; email: string; status: string; }) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Convertir usuarios a formato DataListItem
  const listItems: DataListItem[] = filteredUsers.map((user: { id: string; name: string; email: string; role: string; status: string; phone?: string; createdAt: string; }) => ({
    id: user.id,
    title: user.name,
    subtitle: user.email,
    status: user.status === 'active' ? 'Activo' : 'Inactivo',
    statusVariant: user.status === 'active' ? 'default' : 'secondary',
    metadata: [
      { icon: User, label: user.role },
      { icon: Phone, label: formatPhone(user.phone || '') },
      { icon: Mail, label: user.email }
    ],
    notes: `Creado: ${formatDateTime(user.createdAt)}`,
    actions: [
      {
        icon: Edit,
        label: 'Editar',
        onClick: () => handleEditUser(user),
        variant: 'outline'
      },
      {
        icon: Trash2,
        label: 'Eliminar',
        onClick: () => handleDeleteUser(user),
        variant: 'destructive',
        className: 'border-red-300 text-red-600 hover:bg-red-50'
      }
    ]
  }));

  const handleCreateUser = () => {
    console.log('Create user modal');
    // TODO: Implement modal
  };

  const handleEditUser = (user: Record<string, unknown>) => {
    console.log('Edit user:', user);
    // Lógica para editar usuario
  };

  const handleDeleteUser = (user: Record<string, unknown>) => {
    console.log('Delete user:', user);
    // Lógica para eliminar usuario
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader 
          title="Gestión de Usuarios" 
          description="Administra los usuarios del sistema" 
        />
        <LoadingState message="Cargando usuarios..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader 
          title="Gestión de Usuarios" 
          description="Administra los usuarios del sistema" 
        />
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
          <button onClick={refetch} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Reintentar
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema"
        actionButton={{
          label: "Nuevo Usuario",
          onClick: handleCreateUser,
          icon: <Plus size={20} />
        }}
      />

      <FilterPanel fields={filterFields} />

      <DataList
        title="Lista de Usuarios"
        items={listItems}
        emptyMessage="No se encontraron usuarios"
        emptyDescription={
          searchTerm || statusFilter !== 'all' 
            ? 'Intenta con otros filtros de búsqueda' 
            : 'No hay usuarios registrados en el sistema'
        }
        emptyIcon={User}
        listIcon={User}
      />
    </PageContainer>
  );
}

