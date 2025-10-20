"use client";

import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { RadiologistStats } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

export function RadiologistDashboard() {
  const [stats, setStats] = useState<RadiologistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/radiologist');
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
      title: 'Ver Órdenes',
      description: 'Ver todas las órdenes',
      icon: FileText,
      href: '/radiologia',
    },
    {
      title: 'Órdenes Pendientes',
      description: 'Filtrar solo pendientes',
      icon: Clock,
      href: '/radiologia?status=pending',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Panel de Radiología
        </h2>
        <p className="text-gray-600">
          Gestión de órdenes radiológicas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Órdenes Pendientes"
          value={stats.orders.pending}
          icon={Clock}
          color="text-yellow-600"
          bgColor="bg-yellow-100"
        />
        <StatCard
          title="Órdenes Completadas"
          value={stats.orders.completed}
          icon={CheckCircle}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Órdenes del Día"
          value={stats.orders.today}
          icon={Activity}
          color="text-[#2E9589]"
          bgColor="bg-[#2E9589]/10"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Top Studies */}
      <Card className="bg-white border-gray-200 mb-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#2E9589]" />
            <CardTitle>Estudios Más Solicitados</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {stats.topStudies.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay datos disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.topStudies.map((study, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#2E9589]/10">
                      <span className="text-sm font-semibold text-[#2E9589]">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {study.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {study.count}
                    </p>
                    <p className="text-xs text-gray-500">solicitudes</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay órdenes recientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {order.patient}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {order.items}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.date).toLocaleDateString('es-HN')}
                    </p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

