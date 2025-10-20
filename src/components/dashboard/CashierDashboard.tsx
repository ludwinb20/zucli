"use client";

import { useEffect, useState } from 'react';
import { StatCard } from './StatCard';
import { TrendChart } from './TrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  FileText,
  PlusCircle,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { CashierStats, ChartDataPoint } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

export function CashierDashboard() {
  const [stats, setStats] = useState<CashierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  // Generar datos de gráfico (últimos 7 días)
  const last7Days: ChartDataPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push({
      date: date.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' }),
      value: Math.floor(Math.random() * 5000) + 1000, // Placeholder
      label: date.toLocaleDateString('es-HN'),
    });
  }

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

      {/* Payment Methods (Placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Efectivo"
          value={`L${stats.payments.byMethod.cash.toFixed(2)}`}
          icon={Banknote}
          subtitle="Placeholder"
          color="text-green-600"
          bgColor="bg-green-100"
        />
        <StatCard
          title="Tarjeta"
          value={`L${stats.payments.byMethod.card.toFixed(2)}`}
          icon={CreditCard}
          subtitle="Placeholder"
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
        <StatCard
          title="Transferencia"
          value={`L${stats.payments.byMethod.transfer.toFixed(2)}`}
          icon={ArrowRightLeft}
          subtitle="Placeholder"
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

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

