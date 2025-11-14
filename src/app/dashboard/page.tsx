'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { CashierDashboard } from '@/components/dashboard/CashierDashboard';
import { ReceptionDashboard } from '@/components/dashboard/ReceptionDashboard';
import { RadiologistDashboard } from '@/components/dashboard/RadiologistDashboard';
import { SpecialistDashboard } from '@/components/dashboard/SpecialistDashboard';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const { user } = useAuth();

  // Mostrar loading mientras se carga el usuario
  if (!user) {
    return <LoadingSpinner />;
  }

  // Renderizar el dashboard según el rol del usuario
  switch (user.role?.name) {
    case 'admin':
      return <AdminDashboard />;
    case 'caja':
      return <CashierDashboard />;
    case 'recepcion':
    case 'medico_sala':
      return <ReceptionDashboard />;
    case 'radiologo':
      return <RadiologistDashboard />;
    case 'especialista':
      return <SpecialistDashboard />;
    default:
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Dashboard no disponible
            </h2>
            <p className="text-gray-600">
              No hay un dashboard configurado para tu rol
            </p>
          </div>
        </div>
      );
  }
}
