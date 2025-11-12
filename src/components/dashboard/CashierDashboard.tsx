"use client";

import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { TrendChart } from './TrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  FileText,
  PlusCircle,
  Receipt,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { CashierStats, ChartDataPoint } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

export function CashierDashboard() {
  const [stats, setStats] = useState<CashierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Estados para el rango de fechas
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [rangeStats, setRangeStats] = useState<{
    efectivo: number;
    tarjeta: number;
    transferencia: number;
    total: number;
  } | null>(null);
  const [loadingRange, setLoadingRange] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/cashier');
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

  const handleSearchRange = async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor complete todos los campos de fecha y hora',
        variant: 'error',
      });
      return;
    }

    try {
      setLoadingRange(true);
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast({
          title: 'Fechas inválidas',
          description: 'Por favor verifique las fechas y horas ingresadas',
          variant: 'error',
        });
        return;
      }

      if (startDateTime > endDateTime) {
        toast({
          title: 'Rango inválido',
          description: 'La fecha de inicio debe ser anterior a la fecha de fin',
          variant: 'error',
        });
        return;
      }

      const response = await fetch(
        `/api/dashboard/cashier/range?startDate=${startDateTime.toISOString()}&endDate=${endDateTime.toISOString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al consultar el rango');
      }

      const data = await response.json();
      setRangeStats(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudieron obtener los datos del rango',
        variant: 'error',
      });
    } finally {
      setLoadingRange(false);
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
      title: 'Nuevo Pago',
      description: 'Registrar un nuevo pago',
      icon: PlusCircle,
      href: '/payments',
    },
    {
      title: 'Ver Pagos',
      description: 'Lista de todos los pagos',
      icon: DollarSign,
      href: '/payments',
    },
    {
      title: 'Generar Factura',
      description: 'Crear factura legal o recibo',
      icon: Receipt,
      href: '/invoices',
    },
  ];

  // Usar datos reales del gráfico
  const last7Days = stats.payments.last7Days || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Panel de Caja
        </h2>
        <p className="text-gray-600">
          Gestión de pagos y facturación
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Pagos del Día"
          value={`L${stats.payments.today.toFixed(2)}`}
          icon={DollarSign}
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Pagos de la Semana"
          value={`L${stats.payments.thisWeek.toFixed(2)}`}
          icon={DollarSign}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Pagos del Mes"
          value={`L${stats.payments.thisMonth.toFixed(2)}`}
          icon={DollarSign}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Efectivo"
          value={`L${stats.payments.byMethod.cash.toFixed(2)}`}
          icon={Banknote}
          subtitle="Hoy"
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Tarjeta"
          value={`L${stats.payments.byMethod.card.toFixed(2)}`}
          icon={CreditCard}
          subtitle="Hoy"
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Transferencia"
          value={`L${stats.payments.byMethod.transfer.toFixed(2)}`}
          icon={ArrowRightLeft}
          subtitle="Hoy"
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* Consulta por Rango de Tiempo */}
      <Card className="bg-white border-gray-200 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-[#2E9589]" />
            Consulta por Rango de Tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fecha y Hora de Inicio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fecha y Hora de Fin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleSearchRange}
              disabled={loadingRange}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {loadingRange ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Consultar
                </>
              )}
            </Button>

            {/* Resultados */}
            {rangeStats && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Total Facturado en el Rango Seleccionado
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Banknote className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Efectivo</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      L{rangeStats.efectivo.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Tarjeta</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      L{rangeStats.tarjeta.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">Transferencia</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">
                      L{rangeStats.transferencia.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total General</span>
                    <p className="text-2xl font-bold text-gray-900">
                      L{rangeStats.total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoices Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Facturas Legales"
          value={stats.invoices.legal}
          icon={FileText}
          color="text-[#2E9589]"
          bgColor="bg-[#2E9589]/10"
        />
        <StatCard
          title="Recibos Simples"
          value={stats.invoices.simple}
          icon={Receipt}
          color="text-orange-600"
          bgColor="bg-orange-100"
        />
      </div>

      {/* Chart */}
      <div className="mb-8">
        <TrendChart
          title="Tendencia de Pagos (Últimos 7 Días)"
          data={last7Days}
          type="bar"
          color="#2E9589"
          valuePrefix="L"
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

      {/* Recent Transactions */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Últimas Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay transacciones recientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.patient}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleString('es-HN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      L{transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {transaction.status}
                    </p>
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

