'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FileText, 
  DollarSign, 
  Calendar,
  Scan,
  CreditCard,
  Settings,
  LogOut,
  Stethoscope
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Pacientes Hoy',
      value: '24',
      icon: Users,
      color: 'text-[#2E9589]',
      bgColor: 'bg-[#2E9589]/10'
    },
    {
      title: 'Consultas Pendientes',
      value: '8',
      icon: Calendar,
      color: 'text-[#4CAF50]',
      bgColor: 'bg-[#4CAF50]/10'
    },
    {
      title: 'Facturas del Día',
      value: '15',
      icon: FileText,
      color: 'text-[#1E3A8A]',
      bgColor: 'bg-[#1E3A8A]/10'
    },
    {
      title: 'Ingresos Hoy',
      value: 'L. 12,450',
      icon: DollarSign,
      color: 'text-[#43A047]',
      bgColor: 'bg-[#43A047]/10'
    }
  ];

  const quickActions = [
    {
      title: 'Registrar Paciente',
      description: 'Agregar nuevo paciente al sistema',
      icon: Users,
      href: '/patients/register',
      color: 'hover:bg-[#2E9589]/5 border-[#2E9589]/20'
    },
    {
      title: 'Consulta Externa',
      description: 'Registrar consulta médica',
      icon: Calendar,
      href: '/consultations',
      color: 'hover:bg-[#4CAF50]/5 border-[#4CAF50]/20'
    },
    {
      title: 'Rayos X',
      description: 'Programar estudios radiológicos',
      icon: Scan,
      href: '/xray',
      color: 'hover:bg-[#1E3A8A]/5 border-[#1E3A8A]/20'
    },
    {
      title: 'Caja',
      description: 'Procesar pagos y facturación',
      icon: CreditCard,
      href: '/cashier',
      color: 'hover:bg-[#43A047]/5 border-[#43A047]/20'
    },
    {
      title: 'Facturas',
      description: 'Ver historial de facturas',
      icon: FileText,
      href: '/invoices',
      color: 'hover:bg-[#2E9589]/5 border-[#2E9589]/20'
    },
    {
      title: 'Administración',
      description: 'Gestionar servicios y usuarios',
      icon: Settings,
      href: '/admin',
      color: 'hover:bg-[#F5F7FA] border-gray-200'
    }
  ];


  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenido, {user?.name}
          </h2>
          <p className="text-gray-600">
            Aquí tienes un resumen de las actividades del día
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-transparent border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="cursor-pointer transition-colors bg-transparent border-gray-200 hover:bg-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <action.icon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-transparent border-gray-200">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas acciones realizadas en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Nueva consulta registrada', patient: 'María González', time: 'Hace 5 minutos' },
                { action: 'Factura emitida', patient: 'Juan Pérez', time: 'Hace 12 minutos' },
                { action: 'Paciente registrado', patient: 'Ana López', time: 'Hace 25 minutos' },
                { action: 'Rayos X programados', patient: 'Carlos Ruiz', time: 'Hace 1 hora' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      Paciente: {item.patient}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
