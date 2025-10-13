'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { ChevronDown, User, LogOut, Settings } from 'lucide-react';

export function AppNavbar() {
  const { user, logout } = useAuth();
  const { collapsed } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      admin: 'Administrador',
      especialista: 'Especialista',
      recepcion: 'Recepción',
      caja: 'Caja'
    };
    return roleNames[role] || role;
  };

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: collapsed ? '80px' : '250px',
        right: 0,
        height: '64px',
        backgroundColor: '#2E9589',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 20px',
        zIndex: 999,
        transition: 'left 0.3s ease'
      }}
    >
      {/* Dropdown del usuario */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <User size={20} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {user?.name || 'Usuario'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {user?.role?.name ? getRoleDisplayName(user.role.name) : 'Sin rol'}
            </div>
          </div>
          <ChevronDown size={16} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              minWidth: '200px',
              overflow: 'hidden',
              zIndex: 1000
            }}
          >
            {/* Perfil */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: '#f8f9fa'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                {user?.name || 'Usuario'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {user?.name || 'Usuario'}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                {user?.role?.name ? getRoleDisplayName(user.role.name) : 'Sin rol'}
              </div>
            </div>

            {/* Opciones del menú */}
            <div style={{ padding: '8px 0' }}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  // Aquí puedes agregar lógica para configuración
                  setDropdownOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#333',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings size={16} />
                Configuración
              </button>

              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'left',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
