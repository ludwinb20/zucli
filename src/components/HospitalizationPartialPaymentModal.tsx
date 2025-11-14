'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InlineSpinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Calendar, AlertCircle, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateSimpleReceiptFromDB, generateLegalInvoiceFromDB, printThermalReceipt } from '@/lib/thermal-printer';

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

interface HospitalizationPartialPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId: string;
  onSuccess: () => void;
}

interface HospitalizationData {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    identityNumber: string;
  };
  admissionDate: string;
  status: string;
  dailyRateItem?: {
    name: string;
    basePrice: number;
  };
  dailyRateVariant?: {
    name: string;
    price: number;
  };
  pendingDays?: {
    daysCount: number;
    startDate: string;
    endDate: string;
    hasPendingDays: boolean;
    estimatedCost: number;
  };
  paymentSummary?: {
    totalPaid: number;
    totalPending: number;
    totalPayments: number;
    pendingPaymentsCount: number;
  };
  payments?: Array<{
    id: string;
    daysCount?: number | null;
    daysCoveredStartDate?: string | null;
    daysCoveredEndDate?: string | null;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export default function HospitalizationPartialPaymentModal({
  isOpen,
  onClose,
  hospitalizationId,
  onSuccess,
}: HospitalizationPartialPaymentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [hospitalization, setHospitalization] = useState<HospitalizationData | null>(null);
  const [daysToBill, setDaysToBill] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  
  // Estados para método de pago y facturación
  const [paymentMode, setPaymentMode] = useState<'single' | 'partial'>('single');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [partialPayments, setPartialPayments] = useState<Array<{ method: PaymentMethod; amount: string }>>([]);
  const [useRTN, setUseRTN] = useState(false);
  const [rtnPart1, setRtnPart1] = useState('');
  const [rtnPart2, setRtnPart2] = useState('');
  const [rtnPart3, setRtnPart3] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [detalleGenerico, setDetalleGenerico] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  // Cargar datos de hospitalización
  useEffect(() => {
    if (isOpen && hospitalizationId) {
      loadHospitalizationData();
    }
  }, [isOpen, hospitalizationId]);

  const loadHospitalizationData = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/hospitalizations/${hospitalizationId}`);
      if (!response.ok) {
        throw new Error('Error al cargar datos de hospitalización');
      }
      const data = await response.json();
      setHospitalization(data);
      // Inicializar con el número máximo de días pendientes
      if (data.pendingDays?.hasPendingDays && data.pendingDays.daysCount > 0) {
        setDaysToBill(data.pendingDays.daysCount.toString());
      } else {
        setDaysToBill('0');
      }
      setCustomAmount('');
      setUseCustomAmount(false);
      // Resetear estados de facturación
      setPaymentMode('single');
      setPaymentMethod('efectivo');
      setPartialPayments([]);
      setUseRTN(false);
      setRtnPart1('');
      setRtnPart2('');
      setRtnPart3('');
      setClienteNombre(data.patient ? `${data.patient.firstName} ${data.patient.lastName}` : '');
      setDetalleGenerico(false);
      setObservaciones('');
    } catch (error) {
      console.error('Error loading hospitalization data:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar datos de hospitalización',
        variant: 'error',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreatePartialPayment = async () => {
    if (!hospitalization || !hospitalization.pendingDays?.hasPendingDays) {
      return;
    }

    const daysToBillNum = parseInt(daysToBill);
    const maxDays = hospitalization.pendingDays.daysCount;

    // Validar que el número de días sea válido
    if (isNaN(daysToBillNum) || daysToBillNum < 1 || daysToBillNum > maxDays) {
      toast({
        title: 'Error',
        description: `Debes seleccionar entre 1 y ${maxDays} día(s)`,
        variant: 'error',
      });
      return;
    }

    // Calcular el monto total basado en días
    const dailyRate = getDailyRate();
    const calculatedTotal = daysToBillNum * dailyRate;

    // Validar monto personalizado si se usa
    let finalAmount = calculatedTotal;
    if (useCustomAmount && customAmount) {
      const customAmountNum = parseFloat(customAmount);
      if (isNaN(customAmountNum) || customAmountNum <= 0) {
        toast({
          title: 'Error',
          description: 'El monto personalizado debe ser un número válido mayor a 0',
          variant: 'error',
        });
        return;
      }
      if (customAmountNum > calculatedTotal) {
        toast({
          title: 'Error',
          description: `El monto personalizado no puede ser mayor que L${calculatedTotal.toFixed(2)}`,
          variant: 'error',
        });
        return;
      }
      finalAmount = customAmountNum;
    }

    // Validar método de pago
    if (paymentMode === 'single') {
      if (!paymentMethod) {
        toast({
          title: 'Error',
          description: 'Debe seleccionar un método de pago',
          variant: 'error',
        });
        return;
      }
    } else {
      if (!partialPayments || partialPayments.length === 0) {
        toast({
          title: 'Error',
          description: 'Debe agregar al menos un pago parcial',
          variant: 'error',
        });
        return;
      }
      // Validar que todos los montos sean válidos y sumen el total
      let totalPartial = 0;
      for (const pp of partialPayments) {
        const amount = parseFloat(pp.amount);
        if (isNaN(amount) || amount <= 0) {
          toast({
            title: 'Error',
            description: 'Todos los montos de pago parcial deben ser números válidos mayores a 0',
            variant: 'error',
          });
          return;
        }
        totalPartial += amount;
      }
      if (Math.abs(totalPartial - finalAmount) > 0.01) {
        toast({
          title: 'Error',
          description: `La suma de los pagos parciales (L${totalPartial.toFixed(2)}) debe ser igual al total (L${finalAmount.toFixed(2)})`,
          variant: 'error',
        });
        return;
      }
    }

    // Validar RTN si se usa
    if (useRTN) {
      if (!rtnPart1 || !rtnPart2 || !rtnPart3) {
        toast({
          title: 'Error',
          description: 'Debe completar el RTN completo',
          variant: 'error',
        });
        return;
      }
      if (!clienteNombre || clienteNombre.trim() === '') {
        toast({
          title: 'Error',
          description: 'Debe ingresar el nombre del cliente para factura legal',
          variant: 'error',
        });
        return;
      }
    }

    try {
      setLoading(true);
      
      // Calcular la fecha de fin basada en los días seleccionados
      const startDate = new Date(hospitalization.pendingDays.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysToBillNum - 1); // -1 porque el primer día ya está incluido

      // Preparar el body de la petición
      interface PartialPaymentRequest {
        daysToBill: number;
        endDate: string;
        customAmount: number | null;
        generateInvoice: boolean;
        useRTN: boolean;
        clienteRTN?: string;
        clienteNombre: string;
        detalleGenerico: boolean;
        observaciones: string | null;
        paymentMethod?: PaymentMethod;
        partialPayments?: Array<{ method: PaymentMethod; amount: number }>;
      }

      const requestBody: PartialPaymentRequest = {
        daysToBill: daysToBillNum,
        endDate: endDate.toISOString(),
        customAmount: useCustomAmount && customAmount ? parseFloat(customAmount) : null,
        generateInvoice: true, // Siempre generar factura
        useRTN: Boolean(useRTN && rtnPart1 && rtnPart2 && rtnPart3),
        clienteRTN: useRTN && rtnPart1 && rtnPart2 && rtnPart3 ? `${rtnPart1}-${rtnPart2}-${rtnPart3}` : undefined,
        clienteNombre: useRTN && clienteNombre ? clienteNombre : (hospitalization.patient ? `${hospitalization.patient.firstName} ${hospitalization.patient.lastName}` : ''),
        detalleGenerico,
        observaciones: observaciones || null,
      };

      if (paymentMode === 'partial') {
        requestBody.partialPayments = partialPayments.map(pp => ({
          method: pp.method,
          amount: parseFloat(pp.amount),
        }));
      } else {
        requestBody.paymentMethod = paymentMethod;
      }

      const response = await fetch(`/api/hospitalizations/${hospitalizationId}/partial-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el pago y factura');
      }

      const data = await response.json();

      // Si se generó la factura, imprimirla
      if (data.invoice) {
        let receiptContent: string;
        
        if (data.invoiceType === 'legal') {
          receiptContent = generateLegalInvoiceFromDB(data.invoice);
        } else {
          receiptContent = generateSimpleReceiptFromDB(data.invoice);
        }

        // Imprimir la factura
        printThermalReceipt(receiptContent);
      }

      toast({
        title: 'Éxito',
        description: `Pago creado y facturado exitosamente por ${daysToBillNum} día(s) - L${finalAmount.toFixed(2)}`,
        variant: 'success',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating partial payment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al crear el pago y factura',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `L ${amount.toFixed(2)}`;
  };

  const getDailyRate = () => {
    if (!hospitalization) return 0;
    if (hospitalization.dailyRateVariant?.price) {
      return Number(hospitalization.dailyRateVariant.price);
    }
    if (hospitalization.dailyRateItem?.basePrice) {
      return Number(hospitalization.dailyRateItem.basePrice);
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Facturar Días Pendientes de Hospitalización
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Crea un pago parcial por los días pendientes de esta hospitalización
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <InlineSpinner />
            <span className="ml-2 text-gray-600">Cargando datos...</span>
          </div>
        ) : !hospitalization ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-500">No se pudo cargar la información de la hospitalización</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información de tarifa */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Tarifa Diaria</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-500">Servicio:</span>{' '}
                    <span className="font-medium">
                      {hospitalization.dailyRateItem?.name || 'N/A'}
                    </span>
                    {hospitalization.dailyRateVariant && (
                      <span className="text-gray-500 text-xs block ml-5">
                        Variante: {hospitalization.dailyRateVariant.name}
                      </span>
                    )}
                  </p>
                  <p>
                    <span className="text-gray-500">Precio por día:</span>{' '}
                    <span className="font-medium text-[#2E9589] text-lg">
                      {formatCurrency(getDailyRate())}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Información de días pendientes y selector */}
            {hospitalization.pendingDays && (
              <Card className="border-[#2E9589]">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#2E9589]" />
                    Días Pendientes de Pago
                  </h3>
                  {hospitalization.pendingDays.hasPendingDays ? (
                    <div className="space-y-4">
                      {/* Información de días disponibles */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Días disponibles para facturar:</span>
                          <span className="text-lg font-bold text-blue-700">
                            {hospitalization.pendingDays.daysCount} día(s)
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1 mt-2">
                          <p>
                            Desde: <span className="font-medium">{formatDate(hospitalization.pendingDays.startDate)}</span>
                          </p>
                          <p>
                            Hasta (máximo): <span className="font-medium">{formatDate(hospitalization.pendingDays.endDate)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Selector de días a facturar */}
                      <div className="space-y-2">
                        <Label htmlFor="daysToBill" className="text-sm font-medium text-gray-700">
                          Días a facturar *
                        </Label>
                        <Input
                          id="daysToBill"
                          type="number"
                          min="1"
                          max={hospitalization.pendingDays.daysCount}
                          value={daysToBill}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = parseInt(value);
                            const maxDays = hospitalization.pendingDays?.daysCount || 0;
                            
                            if (value === '') {
                              setDaysToBill('');
                            } else if (!isNaN(numValue) && numValue >= 1 && numValue <= maxDays) {
                              setDaysToBill(value);
                              // Si hay monto personalizado y excede el nuevo máximo, ajustarlo
                              if (useCustomAmount && customAmount) {
                                const newMaxAmount = numValue * getDailyRate();
                                const currentAmount = parseFloat(customAmount);
                                if (!isNaN(currentAmount) && currentAmount > newMaxAmount) {
                                  setCustomAmount(newMaxAmount.toFixed(2));
                                }
                              }
                            } else if (numValue > maxDays) {
                              setDaysToBill(maxDays.toString());
                              // Ajustar monto personalizado si existe
                              if (useCustomAmount && customAmount) {
                                const newMaxAmount = maxDays * getDailyRate();
                                const currentAmount = parseFloat(customAmount);
                                if (!isNaN(currentAmount) && currentAmount > newMaxAmount) {
                                  setCustomAmount(newMaxAmount.toFixed(2));
                                }
                              }
                            }
                          }}
                          className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                          placeholder={`Máximo: ${hospitalization.pendingDays.daysCount} días`}
                        />
                        <p className="text-xs text-gray-500">
                          Selecciona entre 1 y {hospitalization.pendingDays.daysCount} día(s)
                        </p>
                      </div>

                      {/* Cálculo del total basado en días seleccionados */}
                      {daysToBill && !isNaN(parseInt(daysToBill)) && parseInt(daysToBill) > 0 && (
                        <div className="space-y-3">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {parseInt(daysToBill)} día{parseInt(daysToBill) !== 1 ? 's' : ''} seleccionado{parseInt(daysToBill) !== 1 ? 's' : ''}:
                              </span>
                              <span className="text-lg font-bold text-[#2E9589]">
                                {formatCurrency(parseInt(daysToBill) * getDailyRate())}
                              </span>
                            </div>
                            {parseInt(daysToBill) > 1 && (
                              <p className="text-xs text-gray-500 mt-2">
                                {parseInt(daysToBill)} × {formatCurrency(getDailyRate())}
                              </p>
                            )}
                          </div>

                          {/* Opción para monto personalizado */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id="useCustomAmount"
                                checked={useCustomAmount}
                                onChange={(e) => {
                                  setUseCustomAmount(e.target.checked);
                                  if (!e.target.checked) {
                                    setCustomAmount('');
                                  } else {
                                    // Inicializar con el total calculado
                                    setCustomAmount((parseInt(daysToBill) * getDailyRate()).toFixed(2));
                                  }
                                }}
                                className="h-4 w-4 text-[#2E9589] border-gray-300 rounded focus:ring-[#2E9589]"
                              />
                              <Label htmlFor="useCustomAmount" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Usar monto personalizado
                              </Label>
                            </div>

                            {useCustomAmount && (
                              <div className="space-y-2">
                                <Label htmlFor="customAmount" className="text-sm font-medium text-gray-700">
                                  Monto a facturar *
                                </Label>
                                <Input
                                  id="customAmount"
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max={parseInt(daysToBill) * getDailyRate()}
                                  value={customAmount}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const numValue = parseFloat(value);
                                    const maxAmount = parseInt(daysToBill) * getDailyRate();
                                    
                                    if (value === '') {
                                      setCustomAmount('');
                                    } else if (!isNaN(numValue) && numValue >= 0.01 && numValue <= maxAmount) {
                                      setCustomAmount(value);
                                    } else if (numValue > maxAmount) {
                                      setCustomAmount(maxAmount.toFixed(2));
                                    }
                                  }}
                                  className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                                  placeholder={`Máximo: L${(parseInt(daysToBill) * getDailyRate()).toFixed(2)}`}
                                />
                                <p className="text-xs text-gray-500">
                                  Máximo permitido: <span className="font-medium">{formatCurrency(parseInt(daysToBill) * getDailyRate())}</span>
                                </p>
                                {customAmount && parseFloat(customAmount) > parseInt(daysToBill) * getDailyRate() && (
                                  <p className="text-xs text-red-500">
                                    El monto no puede ser mayor que el total calculado
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Mostrar monto final a facturar */}
                            {daysToBill && !isNaN(parseInt(daysToBill)) && parseInt(daysToBill) > 0 && (
                              <div className="bg-[#2E9589]/10 border border-[#2E9589] rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-base font-semibold text-gray-900">
                                    Total a facturar:
                                  </span>
                                  <span className="text-2xl font-bold text-[#2E9589]">
                                    {formatCurrency(
                                      useCustomAmount && customAmount && !isNaN(parseFloat(customAmount))
                                        ? parseFloat(customAmount)
                                        : parseInt(daysToBill) * getDailyRate()
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-yellow-700 font-medium">
                        No hay días pendientes de pago para esta hospitalización
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Método de pago y facturación */}
            {hospitalization?.pendingDays?.hasPendingDays && daysToBill && !isNaN(parseInt(daysToBill)) && parseInt(daysToBill) > 0 && (
              <Card className="border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-blue-600" />
                    Método de Pago y Facturación
                  </h3>

                  <div className="space-y-4">
                    {/* Modo de pago: único o parcial */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Tipo de pago</Label>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="single"
                            checked={paymentMode === 'single'}
                            onChange={() => {
                              setPaymentMode('single');
                              setPartialPayments([]);
                            }}
                            className="h-4 w-4 text-[#2E9589] border-gray-300 focus:ring-[#2E9589]"
                          />
                          <span className="text-sm text-gray-700">Pago único</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="partial"
                            checked={paymentMode === 'partial'}
                            onChange={() => {
                              setPaymentMode('partial');
                              const finalAmount = useCustomAmount && customAmount && !isNaN(parseFloat(customAmount))
                                ? parseFloat(customAmount)
                                : (daysToBill && !isNaN(parseInt(daysToBill)) && parseInt(daysToBill) > 0 
                                    ? parseInt(daysToBill) * getDailyRate() 
                                    : 0);
                              if (finalAmount > 0) {
                                setPartialPayments([{ method: 'efectivo', amount: finalAmount.toFixed(2) }]);
                              } else {
                                setPartialPayments([{ method: 'efectivo', amount: '' }]);
                              }
                            }}
                            className="h-4 w-4 text-[#2E9589] border-gray-300 focus:ring-[#2E9589]"
                          />
                          <span className="text-sm text-gray-700">Pago parcial (múltiples métodos)</span>
                        </label>
                      </div>
                    </div>

                    {/* Pago único */}
                    {paymentMode === 'single' && (
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">
                          Método de pago *
                        </Label>
                        <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
                          <SelectTrigger className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="tarjeta">Tarjeta</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Pagos parciales */}
                    {paymentMode === 'partial' && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Pagos parciales *</Label>
                        {partialPayments.map((pp, index) => (
                          <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Select
                                value={pp.method}
                                onValueChange={(value) => {
                                  const newPartialPayments = [...partialPayments];
                                  newPartialPayments[index].method = value as PaymentMethod;
                                  setPartialPayments(newPartialPayments);
                                }}
                              >
                                <SelectTrigger className="border-gray-300">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="efectivo">Efectivo</SelectItem>
                                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                  <SelectItem value="transferencia">Transferencia</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1">
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={pp.amount}
                                onChange={(e) => {
                                  const newPartialPayments = [...partialPayments];
                                  newPartialPayments[index].amount = e.target.value;
                                  setPartialPayments(newPartialPayments);
                                }}
                                className="border-gray-300"
                                placeholder="Monto"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPartialPayments(partialPayments.filter((_, i) => i !== index));
                              }}
                              disabled={partialPayments.length === 1}
                            >
                              Eliminar
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPartialPayments([...partialPayments, { method: 'efectivo', amount: '' }]);
                          }}
                          className="w-full"
                        >
                          Agregar método de pago
                        </Button>
                        {partialPayments.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
                            <p className="text-gray-600">
                              Total parcial: <span className="font-medium">{formatCurrency(
                                partialPayments.reduce((sum, pp) => sum + (parseFloat(pp.amount) || 0), 0)
                              )}</span>
                            </p>
                            <p className="text-gray-600 mt-1">
                              Total requerido: <span className="font-medium">{formatCurrency(
                                useCustomAmount && customAmount && !isNaN(parseFloat(customAmount))
                                  ? parseFloat(customAmount)
                                  : parseInt(daysToBill) * getDailyRate()
                              )}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Opciones de facturación */}
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="useRTN"
                          checked={useRTN}
                          onCheckedChange={setUseRTN}
                        />
                        <Label htmlFor="useRTN" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Factura legal (con RTN)
                        </Label>
                      </div>

                      {useRTN && (
                        <div className="space-y-3 pl-7">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs text-gray-600">RTN Parte 1</Label>
                              <Input
                                value={rtnPart1}
                                onChange={(e) => setRtnPart1(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="0000"
                                className="border-gray-300 text-sm"
                                maxLength={4}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">RTN Parte 2</Label>
                              <Input
                                value={rtnPart2}
                                onChange={(e) => setRtnPart2(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="0000"
                                className="border-gray-300 text-sm"
                                maxLength={4}
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">RTN Parte 3</Label>
                              <Input
                                value={rtnPart3}
                                onChange={(e) => setRtnPart3(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                className="border-gray-300 text-sm"
                                maxLength={6}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="clienteNombre" className="text-sm font-medium text-gray-700">
                              Nombre del cliente *
                            </Label>
                            <Input
                              id="clienteNombre"
                              value={clienteNombre}
                              onChange={(e) => setClienteNombre(e.target.value)}
                              placeholder="Nombre de la empresa o cliente"
                              className="border-gray-300"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="detalleGenerico"
                          checked={detalleGenerico}
                          onCheckedChange={setDetalleGenerico}
                        />
                        <Label htmlFor="detalleGenerico" className="text-sm font-medium text-gray-700 cursor-pointer">
                          Usar descripción genérica &quot;Servicios Médicos&quot;
                        </Label>
                      </div>

                      <div>
                        <Label htmlFor="observaciones" className="text-sm font-medium text-gray-700">
                          Observaciones (opcional)
                        </Label>
                        <Textarea
                          id="observaciones"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Observaciones adicionales..."
                          rows={3}
                          className="border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historial de pagos */}
            {hospitalization.payments && hospitalization.payments.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Historial de Pagos</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {hospitalization.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <div className="flex-1">
                          {payment.daysCount ? (
                            <span className="font-medium">
                              {payment.daysCount} día(s)
                            </span>
                          ) : (
                            <span className="text-gray-500">Pago inicial</span>
                          )}
                          <span className="text-gray-500 ml-2">
                            - {formatDate(payment.createdAt)}
                          </span>
                          {payment.daysCoveredStartDate && payment.daysCoveredEndDate && (
                            <span className="text-xs text-gray-400 block ml-4">
                              {formatDate(payment.daysCoveredStartDate)} - {formatDate(payment.daysCoveredEndDate)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(payment.total)}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs ${
                              payment.status === 'pagado'
                                ? 'bg-green-100 text-green-700'
                                : payment.status === 'pendiente'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreatePartialPayment}
            disabled={
              loading || 
              !hospitalization?.pendingDays?.hasPendingDays || 
              !daysToBill || 
              isNaN(parseInt(daysToBill)) || 
              parseInt(daysToBill) < 1 ||
              (useCustomAmount && (!customAmount || isNaN(parseFloat(customAmount)) || parseFloat(customAmount) <= 0)) ||
              (paymentMode === 'single' && !paymentMethod) ||
              (paymentMode === 'partial' && (!partialPayments || partialPayments.length === 0 || partialPayments.some(pp => !pp.method || !pp.amount || isNaN(parseFloat(pp.amount)) || parseFloat(pp.amount) <= 0))) ||
              (useRTN && (!rtnPart1 || !rtnPart2 || !rtnPart3 || !clienteNombre.trim()))
            }
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            {loading ? (
              <>
                <InlineSpinner className="mr-2" />
                Creando y facturando...
              </>
            ) : (
              <>
                <Receipt className="h-4 w-4 mr-2" />
                Crear y Facturar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

