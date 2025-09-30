'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CreditCard, DollarSign, Receipt, CheckCircle, AlertCircle } from 'lucide-react';

export default function CashierPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    method: 'cash',
    amount: '',
    change: '',
    rtn: ''
  });

  // Datos dummy para facturas pendientes
  const pendingInvoices = [
    {
      id: 'INV-001',
      patientName: 'María González',
      services: ['Consulta Externa'],
      subtotal: 800,
      tax: 0,
      total: 800,
      rtn: '0801-1990-12345',
      createdAt: '2024-09-17 10:30'
    },
    {
      id: 'INV-002',
      patientName: 'Juan Pérez',
      services: ['Rayos X - Tórax'],
      subtotal: 1000,
      tax: 0,
      total: 1000,
      rtn: null,
      createdAt: '2024-09-17 11:15'
    },
    {
      id: 'INV-003',
      patientName: 'Ana López',
      services: ['Consulta Externa', 'Rayos X - Abdomen'],
      subtotal: 1700,
      tax: 0,
      total: 1700,
      rtn: '0801-1985-67890',
      createdAt: '2024-09-17 12:00'
    }
  ];

  const paidInvoices = [
    {
      id: 'INV-004',
      patientName: 'Carlos Ruiz',
      services: ['Consulta Externa'],
      subtotal: 800,
      tax: 0,
      total: 800,
      rtn: '0801-1982-54321',
      createdAt: '2024-09-17 09:00',
      paidAt: '2024-09-17 09:15',
      paymentMethod: 'Efectivo'
    }
  ];

  const handlePayment = async () => {
    setIsLoading(true);
    
    // Simular procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setSelectedInvoice(null);
    setPaymentData({ method: 'cash', amount: '', change: '', rtn: '' });
  };

  const calculateChange = () => {
    if (selectedInvoice && paymentData.amount) {
      const amount = parseFloat(paymentData.amount);
      const total = selectedInvoice.total;
      return amount >= total ? (amount - total).toFixed(2) : '0.00';
    }
    return '0.00';
  };

  const InvoiceCard = ({ invoice, isPaid = false }: { invoice: any, isPaid?: boolean }) => (
    <Card className={`cursor-pointer transition-colors hover:bg-gray-50 ${selectedInvoice?.id === invoice.id ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-medium text-gray-900">{invoice.id}</h4>
            <p className="text-sm text-gray-600">{invoice.patientName}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">L. {invoice.total}</p>
            {isPaid && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Pagado
              </span>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          {invoice.services.map((service: string, index: number) => (
            <p key={index} className="text-sm text-gray-600">• {service}</p>
          ))}
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {isPaid ? `Pagado: ${invoice.paidAt}` : invoice.createdAt}
          </span>
          {invoice.rtn && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              RTN: {invoice.rtn}
            </span>
          )}
        </div>
        
        {!isPaid && (
          <Button 
            size="sm" 
            className="w-full mt-3"
            onClick={() => setSelectedInvoice(invoice)}
          >
            Procesar Pago
          </Button>
        )}
      </CardContent>
    </Card>
  );

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
              {/* <CreditCard className="h-6 w-6 text-[#43A047] mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Caja
              </h1> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Facturas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Facturas</CardTitle>
                <CardDescription>
                  Gestionar pagos y facturación
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {/* Tabs */}
                <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'pending'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Pendientes ({pendingInvoices.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('paid')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'paid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Pagadas ({paidInvoices.length})
                  </button>
                </div>

                {/* Lista de Facturas */}
                <div className="space-y-4">
                  {activeTab === 'pending' ? (
                    pendingInvoices.map((invoice) => (
                      <InvoiceCard key={invoice.id} invoice={invoice} />
                    ))
                  ) : (
                    paidInvoices.map((invoice) => (
                      <InvoiceCard key={invoice.id} invoice={invoice} isPaid={true} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Pago */}
          <div className="space-y-6">
            {selectedInvoice && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Procesar Pago
                  </CardTitle>
                  <CardDescription>
                    Factura: {selectedInvoice.id}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Información de la Factura */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Paciente:</span>
                          <span className="text-sm font-medium">{selectedInvoice.patientName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Subtotal:</span>
                          <span className="text-sm">L. {selectedInvoice.subtotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Impuestos:</span>
                          <span className="text-sm">L. {selectedInvoice.tax}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>L. {selectedInvoice.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* RTN */}
                    {selectedInvoice.rtn && (
                      <div className="space-y-2">
                        <Label htmlFor="rtn">RTN del Paciente</Label>
                        <Input
                          id="rtn"
                          value={selectedInvoice.rtn}
                          disabled
                          className="bg-gray-100"
                        />
                      </div>
                    )}

                    {/* Método de Pago */}
                    <div className="space-y-2">
                      <Label>Método de Pago</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={paymentData.method === 'cash' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPaymentData(prev => ({ ...prev, method: 'cash' }))}
                        >
                          Efectivo
                        </Button>
                        <Button
                          type="button"
                          variant={paymentData.method === 'card' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPaymentData(prev => ({ ...prev, method: 'card' }))}
                        >
                          Tarjeta
                        </Button>
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto Recibido</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Cambio */}
                    {paymentData.method === 'cash' && paymentData.amount && (
                      <div className="space-y-2">
                        <Label>Cambio</Label>
                        <div className="p-3 bg-[#43A047]/10 rounded-lg">
                          <p className="text-lg font-bold text-[#43A047]">
                            L. {calculateChange()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Botones */}
                    <div className="space-y-2">
                      <Button 
                        onClick={handlePayment}
                        disabled={isLoading || !paymentData.amount || parseFloat(paymentData.amount) < selectedInvoice.total}
                        className="w-full"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Procesando...
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Procesar Pago
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedInvoice(null)}
                        className="w-full"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resumen del Día */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Facturas Pagadas:</span>
                    <span className="font-medium">4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Ingresos:</span>
                    <span className="font-bold text-lg">L. 4,300</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Efectivo:</span>
                    <span className="font-medium">L. 2,800</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tarjeta:</span>
                    <span className="font-medium">L. 1,500</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
