"use client";

import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { TrendChart } from './TrendChart';
import { RecentActivity } from './RecentActivity';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Calendar,
  DollarSign,
  Activity,
  Settings,
  UserCog,
  FileText,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { AdminStats, ChartDataPoint } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/admin');
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E9589]"></div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Administración',
      description: 'Gestionar servicios y configuración',
      icon: Settings,
      href: '/admin',
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar usuarios del sistema',
      icon: UserCog,
      href: '/admin/users',
    },
    {
      title: 'Ver Citas',
      description: 'Gestionar citas médicas',
      icon: Calendar,
      href: '/appointments',
    },
  ];

  // Generar datos de gráfico (últimos 7 días)
  const last7Days: ChartDataPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push({
      date: date.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' }),
      value: Math.floor(Math.random() * 20) + 5, // Placeholder
      label: date.toLocaleDateString('es-HN'),
    });
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Panel de Administración
        </h2>
        <p className="text-gray-600">
          Resumen general del sistema
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Pacientes"
          value={stats.patients.total}
          icon={Users}
          subtitle={`${stats.patients.newThisMonth} nuevos este mes`}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Citas del Día"
          value={Object.values(stats.appointments.today).reduce((a, b) => a + b, 0)}
          icon={Calendar}
          subtitle={`${stats.appointments.thisWeek} esta semana`}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Ingresos del Día"
          value={`L${stats.revenue.today.toFixed(2)}`}
          icon={DollarSign}
          subtitle={`L${stats.revenue.thisMonth.toFixed(2)} este mes`}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Órdenes Radiología"
          value={stats.pendingOrders.radiology}
          icon={FileText}
          subtitle="Pendientes"
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
        <StatCard
          title="Consultas Pendientes"
          value={stats.pendingOrders.consultations}
          icon={ClipboardList}
          subtitle="Por atender"
          color="text-red-600"
          bgColor="bg-red-100"
        />
        <StatCard
          title="Usuarios Activos"
          value={Object.values(stats.activeUsers.byRole).reduce((a, b) => a + b, 0)}
          icon={Activity}
          color="text-[#2E9589]"
          bgColor="bg-[#2E9589]/10"
        />
      </div>

      {/* Citas por Estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.appointments.today.pending}</p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.appointments.today.confirmed}</p>
              <p className="text-sm text-gray-600">Confirmadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.appointments.today.completed}</p>
              <p className="text-sm text-gray-600">Completadas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.appointments.today.cancelled}</p>
              <p className="text-sm text-gray-600">Canceladas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <div className="mb-8">
        <TrendChart
          title="Citas de la Última Semana"
          data={last7Days}
          type="line"
          color="#2E9589"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="cursor-pointer transition-colors bg-white border-gray-200 hover:bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-[#2E9589]/10 rounded-lg">
                      <action.icon className="h-6 w-6 text-[#2E9589]" />
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
      <RecentActivity activities={stats.recentActivity} />
    </div>
  );
}

