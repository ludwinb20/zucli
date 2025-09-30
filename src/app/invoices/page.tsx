'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileText, Search, Filter, Download, Eye, Calendar, DollarSign } from 'lucide-react';

export default function InvoicesListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Datos dummy para facturas
  const invoices = [
    {
      id: 'INV-001',
      patientName: 'María González',
      patientId: 'PAT-001',
      services: ['Consulta Externa'],
      subtotal: 800,
      tax: 0,
      total: 800,
      rtn: '0801-1990-12345',
      status: 'paid',
      paymentMethod: 'Efectivo',
      createdAt: '2024-09-17',
      paidAt: '2024-09-17 10:45'
    },
    {
      id: 'INV-002',
      patientName: 'Juan Pérez',
      patientId: 'PAT-002',
      services: ['Rayos X - Tórax'],
      subtotal: 1000,
      tax: 0,
      total: 1000,
      rtn: null,
      status: 'paid',
      paymentMethod: 'Tarjeta',
      createdAt: '2024-09-17',
      paidAt: '2024-09-17 11:30'
    },
    {
      id: 'INV-003',
      patientName: 'Ana López',
      patientId: 'PAT-003',
      services: ['Consulta Externa', 'Rayos X - Abdomen'],
      subtotal: 1700,
      tax: 0,
      total: 1700,
      rtn: '0801-1985-67890',
      status: 'pending',
      paymentMethod: null,
      createdAt: '2024-09-17',
      paidAt: null
    },
    {
      id: 'INV-004',
      patientName: 'Carlos Ruiz',
      patientId: 'PAT-004',
      services: ['Consulta Externa'],
      subtotal: 800,
      tax: 0,
      total: 800,
      rtn: '0801-1982-54321',
      status: 'paid',
      paymentMethod: 'Efectivo',
      createdAt: '2024-09-16',
      paidAt: '2024-09-16 15:20'
    },
    {
      id: 'INV-005',
      patientName: 'Elena Martínez',
      patientId: 'PAT-005',
      services: ['Rayos X - Columna'],
      subtotal: 1200,
      tax: 0,
      total: 1200,
      rtn: null,
      status: 'cancelled',
      paymentMethod: null,
      createdAt: '2024-09-16',
      paidAt: null
    }
  ];

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesDate = !dateFilter || invoice.createdAt === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', text: 'Pagada' },
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pendiente' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelada' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string | null) => {
    if (!method) return null;
    return method === 'Efectivo' ? <DollarSign className="h-3 w-3" /> : <FileText className="h-3 w-3" />;
  };

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidAmount = filteredInvoices.filter(invoice => invoice.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button> */}
            <div className="flex items-center">
              {/* <FileText className="h-6 w-6 text-orange-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Historial de Facturas
              </h1> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y Búsqueda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Paciente o ID de factura..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">Todos</option>
                  <option value="paid">Pagadas</option>
                  <option value="pending">Pendientes</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Acciones</Label>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setDateFilter('');
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Facturas</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredInvoices.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monto Total</p>
                  <p className="text-2xl font-bold text-gray-900">L. {totalAmount.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monto Pagado</p>
                  <p className="text-2xl font-bold text-gray-900">L. {paidAmount.toLocaleString()}</p>
                </div>
                <Calendar className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Facturas */}
        <Card>
          <CardHeader>
            <CardTitle>Facturas ({filteredInvoices.length})</CardTitle>
            <CardDescription>
              Lista de todas las facturas del sistema
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{invoice.id}</h4>
                      <p className="text-sm text-gray-600">{invoice.patientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">L. {invoice.total}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Servicios</p>
                      <div className="space-y-1">
                        {invoice.services.map((service, index) => (
                          <p key={index} className="text-sm text-gray-700">• {service}</p>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Información</p>
                      <p className="text-sm text-gray-700">Fecha: {invoice.createdAt}</p>
                      {invoice.paidAt && (
                        <p className="text-sm text-gray-700">Pagado: {invoice.paidAt}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Detalles</p>
                      {invoice.rtn && (
                        <p className="text-sm text-gray-700">RTN: {invoice.rtn}</p>
                      )}
                      {invoice.paymentMethod && (
                        <div className="flex items-center text-sm text-gray-700">
                          {getPaymentMethodIcon(invoice.paymentMethod)}
                          <span className="ml-1">{invoice.paymentMethod}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredInvoices.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron facturas con los filtros aplicados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
