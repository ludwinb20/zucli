'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Settings
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Verificar permisos
  useEffect(() => {
    if (user && user.role?.name !== "admin") {
      router.push("/login");
    }
  }, [user, router]);

  // No renderizar si no es admin
  if (user?.role?.name !== "admin") {
    return null;
  }

  const stats = [
    {
      title: 'Usuarios Activos',
      value: '4',
      icon: Users,
      color: 'text-[#2E9589]',
      bgColor: 'bg-[#2E9589]/10'
    },
    {
      title: 'Sistema',
      value: 'Activo',
      icon: Settings,
      color: 'text-[#4CAF50]',
      bgColor: 'bg-[#4CAF50]/10'
    }
  ];

  const quickActions = [
    {
      title: 'Administración',
      description: 'Gestionar servicios y usuarios',
      icon: Settings,
      href: '/admin',
      color: 'hover:bg-[#F5F7FA] border-gray-200'
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar usuarios del sistema',
      icon: Users,
      href: '/admin/users',
      color: 'hover:bg-[#2E9589]/5 border-[#2E9589]/20'
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                { action: 'Sistema iniciado', user: 'Administrador', time: 'Hace 5 minutos' },
                { action: 'Usuario autenticado', user: user?.name || 'Usuario', time: 'Hace 2 minutos' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.action}
                    </p>
                    <p className="text-sm text-gray-600">
                      Usuario: {item.user}
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
