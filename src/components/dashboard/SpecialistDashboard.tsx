"use client";

import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  CheckCircle,
  Clock,
  ClipboardList,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { SpecialistStats } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

export function SpecialistDashboard() {
  const [stats, setStats] = useState<SpecialistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/specialist');
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
      title: 'Ver Citas',
      description: 'Ver todas mis citas',
      icon: Calendar,
      href: '/appointments',
    },
    {
      title: 'Consulta Externa',
      description: 'Realizar consulta',
      icon: FileText,
      href: '/consulta-externa',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completada', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
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
          Panel de Especialista
        </h2>
        <p className="text-gray-600">
          Gestión de citas y consultas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Citas de Hoy"
          value={stats.appointmentsToday.length}
          icon={Calendar}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Citas de la Semana"
          value={stats.appointmentsWeek.length}
          icon={Clock}
          subtitle="Próximos 7 días"
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
        <StatCard
          title="Consultas del Mes"
          value={stats.consultations.thisMonth}
          icon={ClipboardList}
          subtitle={`${stats.consultations.completed} completadas`}
          color="text-green-600"
          bgColor="bg-green-100"
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

      {/* Citas de Hoy */}
      <Card className="bg-white border-gray-200 mb-8">
        <CardHeader>
          <CardTitle>Citas de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.appointmentsToday.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay citas programadas para hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.appointmentsToday.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.patient}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(appointment.time).toLocaleTimeString('es-HN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(appointment.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Citas de los Próximos 7 Días */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Próximas Citas (7 Días)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.appointmentsWeek.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay citas próximas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.appointmentsWeek.map((appointment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.patient}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(appointment.date).toLocaleDateString('es-HN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                      })}
                      {' • '}
                      {new Date(appointment.time).toLocaleTimeString('es-HN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(appointment.status)}
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

