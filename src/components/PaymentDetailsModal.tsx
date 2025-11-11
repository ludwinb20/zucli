"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Receipt,
  XCircle,
  Building2,
  Stethoscope,
  ShoppingCart,
  HelpCircle,
  Activity,
  Scissors,
  Wallet,
  CreditCard,
  ArrowRightLeft,
  Percent,
  DollarSign,
} from "lucide-react";
import { PaymentWithRelations, PaymentStatus, PaymentMethod } from "@/types/payments";
import { InlineSpinner } from "@/components/ui/spinner";
import { generateSimpleReceiptFromDB, generateLegalInvoiceFromDB, printThermalReceipt } from "@/lib/thermal-printer";
import { extractISVFromTotal, calculateDiscount } from "@/lib/calculations";
import { useToast } from "@/hooks/use-toast";

interface PaymentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentWithRelations | null;
  onUpdate: () => void;
}

export default function PaymentDetailsModal({
  isOpen,
  onClose,
  payment,
  onUpdate,
}: PaymentDetailsModalProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [useGenericDescription, setUseGenericDescription] = useState(false);
  const [useRTN, setUseRTN] = useState(false);
  const [rtnPart1, setRtnPart1] = useState("");
  const [rtnPart2, setRtnPart2] = useState("");
  const [rtnPart3, setRtnPart3] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("efectivo");
  const [discountType, setDiscountType] = useState<'percentage' | 'absolute' | null>(null);
  const [discountValue, setDiscountValue] = useState<string>("");
  const [discountReason, setDiscountReason] = useState<string>("");

  // Resetear switches al abrir/cambiar pago
  useEffect(() => {
    setUseGenericDescription(false);
    setUseRTN(false);
    setRtnPart1("");
    setRtnPart2("");
    setRtnPart3("");
    setCompanyName("");
    setPaymentMethod("efectivo");
    // Inicializar descuentos desde el pago existente o resetear
    if (payment?.discountType && payment?.discountValue) {
      setDiscountType(payment.discountType as 'percentage' | 'absolute');
      setDiscountValue(payment.discountValue.toString());
      setDiscountReason(payment.discountReason || "");
    } else {
      setDiscountType(null);
      setDiscountValue("");
      setDiscountReason("");
    }
  }, [payment]);

  if (!payment) return null;

  const handleUpdateStatus = async (newStatus: PaymentStatus) => {
    try {
      setUpdating(true);

      // Si se marca como pagado, generar factura e imprimir
      // El backend automáticamente actualizará el estado a "paid"
      if (newStatus === "paid") {
        await handleGenerateInvoice();
        // No hacer otra llamada API, el backend ya actualizó el estado
        onUpdate(); // Actualizar la lista
        onClose(); // Cerrar el modal
        return;
      }

      // Para otros estados, hacer la actualización normal
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el pago");
      }

      onUpdate();
    } catch (error) {
      console.error("Error updating payment:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      // Validar descuento si está configurado
      if (discountType && discountValue) {
        const discountNum = parseFloat(discountValue);
        if (isNaN(discountNum) || discountNum < 0) {
          toast({
            title: "Error",
            description: "El valor del descuento debe ser un número válido",
            variant: "error",
          });
          return;
        }
        if (discountType === 'percentage' && (discountNum > 100 || discountNum < 0)) {
          toast({
            title: "Error",
            description: "El descuento porcentual debe estar entre 0 y 100",
            variant: "error",
          });
          return;
        }
        // Obtener el subtotal antes del ISV del total actual
        const { subtotal } = extractISVFromTotal(payment.total);
        if (discountType === 'absolute' && discountNum > subtotal) {
          toast({
            title: "Error",
            description: "El descuento absoluto no puede ser mayor al subtotal",
            variant: "error",
          });
          return;
        }
      }

      // Si hay descuento configurado, actualizar el pago primero
      if (discountType && discountValue && payment.status === "pendiente") {
        const discountNum = parseFloat(discountValue);
        const updateResponse = await fetch(`/api/payments/${payment.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            discountType,
            discountValue: discountNum,
            discountReason: discountReason || null,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.error || 'Error al actualizar el descuento');
        }
      }

      // Generar factura en el backend
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          useRTN: useRTN && rtnPart1 && rtnPart2 && rtnPart3 && companyName,
          clienteRTN: useRTN ? `${rtnPart1}-${rtnPart2}-${rtnPart3}` : undefined,
          clienteNombre: useRTN ? companyName : `${payment.patient.firstName} ${payment.patient.lastName}`,
          detalleGenerico: useGenericDescription,
          observaciones: null,
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar la factura');
      }

      const data = await response.json();

      console.log("📄 Datos de factura recibidos:");
      console.log(data);
      console.log("📦 Items en data.invoice:", data.invoice?.items);
      console.log("📦 Cantidad de items:", data.invoice?.items?.length);

      let receiptContent: string;

      if (data.type === 'legal') {
        // Factura Legal - usar función de BD que usa snapshot de items
        console.log("🖨️ Generando factura legal con:", data.invoice);
        receiptContent = generateLegalInvoiceFromDB(data.invoice);
      } else {
        // Recibo Simple - usar función de BD que usa snapshot de items
        console.log("🖨️ Generando recibo simple con:", data.invoice);
        receiptContent = generateSimpleReceiptFromDB(data.invoice);
      }

      // Imprimir
      printThermalReceipt(receiptContent);

      // Mostrar mensaje de éxito
      toast({
        title: "Factura generada",
        description: "La factura se ha generado e impreso correctamente. El pago ahora está marcado como pagado.",
        variant: "success",
      });

    } catch (error) {
      console.error("Error generando factura:", error);
      toast({
        title: "Error",
        description: (error instanceof Error ? error.message : "Error al generar la factura para imprimir"),
        variant: "error",
      });
      throw error; // Re-throw para que handleUpdateStatus lo maneje
    }
  };

  const formatCurrency = (amount: number) => {
    return `L ${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateSubtotalItems = () => {
    if (!payment.items || payment.items.length === 0) {
      // Si no hay items, calcular desde el total del pago (que ya incluye ISV)
      const { subtotal } = extractISVFromTotal(payment.total);
      return subtotal;
    }
    return payment.items.reduce((sum, item) => {
      return sum + item.total; // Usar el total precalculado del TransactionItem
    }, 0);
  };

  const getSubtotalBeforeISV = () => {
    const subtotalItems = calculateSubtotalItems();
    // Extraer el subtotal antes del ISV (los items ya incluyen ISV)
    const { subtotal } = extractISVFromTotal(subtotalItems);
    return subtotal;
  };

  const calculateDiscount = () => {
    // Si hay un descuento siendo ingresado en el formulario, calcularlo
    if (discountType && discountValue) {
      const discountNum = parseFloat(discountValue);
      if (!isNaN(discountNum) && discountNum > 0) {
        const subtotalSinISV = getSubtotalBeforeISV();
        
        if (discountType === 'percentage') {
          return (subtotalSinISV * discountNum) / 100;
        } else {
          return Math.min(discountNum, subtotalSinISV);
        }
      }
    }
    // Si no hay descuento en el formulario, usar el del payment guardado
    return payment.discountAmount || 0;
  };

  const calculateSubtotal = () => {
    const subtotalSinISV = getSubtotalBeforeISV();
    const discount = calculateDiscount();
    return subtotalSinISV - discount;
  };

  const calculateISV = () => {
    const subtotalConDescuento = calculateSubtotal();
    // ISV es el 15% del subtotal con descuento
    return subtotalConDescuento * 0.15;
  };

  const calculateTotal = () => {
    const subtotalConDescuento = calculateSubtotal();
    const isv = calculateISV();
    return subtotalConDescuento + isv;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-8">
        <DialogHeader className="sr-only">
          <DialogTitle>Detalles de Factura</DialogTitle>
        </DialogHeader>
        
        {/* Header tipo Factura */}
        <div className="border-b-4 border-[#2E9589] pb-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {payment.patient.firstName} {payment.patient.lastName}
              </h1>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Identidad:</span> {payment.patient.identityNumber}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-gray-500">
                <span className="font-semibold">No. Factura:</span> {payment.id.substring(0, 10).toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-semibold">Fecha:</span> {formatDate(payment.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Indicador de Fuente del Pago */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
            {payment.consultationId ? (
              <>
                <Stethoscope size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-blue-700">Origen: Consulta Médica</span>
              </>
            ) : payment.saleId ? (
              <>
                <ShoppingCart size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-blue-700">Origen: Venta Directa</span>
              </>
            ) : payment.hospitalizationId ? (
              <>
                <Building2 size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-blue-700">Origen: Hospitalización</span>
              </>
            ) : payment.surgeryId ? (
              <>
                <Scissors size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-blue-700">Origen: Cirugía</span>
              </>
            ) : (
              <>
                <HelpCircle size={14} className="text-blue-500" />
                <span className="text-xs font-medium text-blue-700">Origen: Sin origen</span>
              </>
            )}
          </div>
        </div>

        {/* Mostrar método de pago cuando está pagado */}
        {payment.status === "paid" && payment.paymentMethod && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              {payment.paymentMethod === "efectivo" && <Wallet size={20} className="text-green-600" />}
              {payment.paymentMethod === "tarjeta" && <CreditCard size={20} className="text-green-600" />}
              {payment.paymentMethod === "transferencia" && <ArrowRightLeft size={20} className="text-green-600" />}
              <div>
                <p className="text-sm font-medium text-gray-900">Método de Pago</p>
                <p className="text-xs text-gray-600">
                  {payment.paymentMethod === "efectivo" && "Efectivo"}
                  {payment.paymentMethod === "tarjeta" && "Tarjeta"}
                  {payment.paymentMethod === "transferencia" && "Transferencia"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Opciones de Facturación - Solo mostrar si está pendiente */}
        {payment.status === "pendiente" && (
          <>
            {/* Selector de Método de Pago */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Label className="text-sm font-medium text-gray-900 mb-3 block">
                Método de Pago *
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("efectivo")}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === "efectivo"
                      ? "border-[#2E9589] bg-[#2E9589]/10 text-[#2E9589]"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <Wallet size={24} className="mb-2" />
                  <span className="text-sm font-medium">Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("tarjeta")}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === "tarjeta"
                      ? "border-[#2E9589] bg-[#2E9589]/10 text-[#2E9589]"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <CreditCard size={24} className="mb-2" />
                  <span className="text-sm font-medium">Tarjeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("transferencia")}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                    paymentMethod === "transferencia"
                      ? "border-[#2E9589] bg-[#2E9589]/10 text-[#2E9589]"
                      : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <ArrowRightLeft size={24} className="mb-2" />
                  <span className="text-sm font-medium">Transferencia</span>
                </button>
              </div>
            </div>

            {/* Opciones de Facturación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Switch para descripción genérica */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex-1 mr-4">
                  <Label htmlFor="generic-description" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Descripción Genérica
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Mostrar &quot;Servicios Médicos&quot; en lugar del detalle específico
                  </p>
                </div>
                <Switch
                  id="generic-description"
                  checked={useGenericDescription}
                  onCheckedChange={setUseGenericDescription}
                />
              </div>

              {/* Switch para RTN */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex-1 mr-4">
                  <Label htmlFor="use-rtn" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Factura con RTN
                  </Label>
                  <p className="text-xs text-gray-600 mt-1">
                    Incluir información fiscal de empresa
                  </p>
                </div>
                <Switch
                  id="use-rtn"
                  checked={useRTN}
                  onCheckedChange={setUseRTN}
                />
              </div>
            </div>
          </>
        )}

        {/* Campos de Descuento - Solo mostrar si está pendiente */}
        {payment.status === "pendiente" && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              Descuento (Opcional)
            </Label>
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  setDiscountType('percentage');
                  setDiscountValue("");
                }}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  discountType === 'percentage'
                    ? 'border-[#2E9589] bg-[#2E9589]/10 text-[#2E9589]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Percent className="h-5 w-5" />
                  <span className="font-medium">Porcentaje</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountType('absolute');
                  setDiscountValue("");
                }}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  discountType === 'absolute'
                    ? 'border-[#2E9589] bg-[#2E9589]/10 text-[#2E9589]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-medium">Monto Fijo</span>
                </div>
              </button>
              {discountType && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDiscountType(null);
                    setDiscountValue("");
                    setDiscountReason("");
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>

            {discountType && (
              <>
                <div className="space-y-2 mb-4">
                  <Label className="text-sm font-medium text-gray-900">
                    Valor del Descuento {discountType === 'percentage' ? '(%)' : '(L)'} *
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    step={discountType === 'percentage' ? '0.01' : '0.01'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? 'Ej: 10' : 'Ej: 50.00'}
                    className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">
                    Razón del Descuento (Opcional)
                  </Label>
                  <Textarea
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Ej: Descuento por paciente de la tercera edad"
                    rows={2}
                    className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Campos de RTN (solo si está activado y pendiente) */}
        {payment.status === "pendiente" && useRTN && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                <Building2 size={14} />
                <span>RTN * (Formato: 0000-0000-00000)</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="rtn-part1"
                  value={rtnPart1}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setRtnPart1(value);
                    if (value.length === 4) {
                      document.getElementById('rtn-part2')?.focus();
                    }
                  }}
                  placeholder="0000"
                  maxLength={4}
                  className="w-20 text-center border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
                <span className="text-gray-500 font-bold">-</span>
                <Input
                  id="rtn-part2"
                  value={rtnPart2}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setRtnPart2(value);
                    if (value.length === 4) {
                      document.getElementById('rtn-part3')?.focus();
                    }
                  }}
                  placeholder="0000"
                  maxLength={4}
                  className="w-20 text-center border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
                <span className="text-gray-500 font-bold">-</span>
                <Input
                  id="rtn-part3"
                  value={rtnPart3}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setRtnPart3(value);
                  }}
                  placeholder="00000"
                  maxLength={5}
                  className="w-24 text-center border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-name-input" className="text-sm font-medium text-gray-900">
                Nombre de la Empresa *
              </Label>
              <Input
                id="company-name-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nombre de la empresa"
                className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>
          </div>
        )}

        {/* Items del Pago - Solo Lectura */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-gray-700">
              Detalle
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6">
            <div className="space-y-3">
              {payment.items && payment.items.map((item) => {
                // Mostrar descripción genérica o específica
                const itemName = useGenericDescription 
                  ? "Servicios Médicos" 
                  : item.nombre; // Usar snapshot
                const itemPrice = item.precioUnitario; // Usar snapshot
                const itemTotal = item.total; // Usar total precalculado
                
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{itemName}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'} × {formatCurrency(itemPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(itemTotal)}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Totales con desglose */}
              <div className="mt-6 pt-4 border-t-2 border-gray-300 space-y-2">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(getSubtotalBeforeISV())}</span>
                </div>
                
                {/* Descuentos */}
                {calculateDiscount() > 0 && (
                  <div className="flex items-center justify-between text-sm text-red-600">
                    <div className="flex flex-col">
                      <span>Descuento:</span>
                      {(discountReason || payment.discountReason) && (
                        <span className="text-xs text-gray-500 italic">({discountReason ? discountReason : payment.discountReason})</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-medium">
                        - {formatCurrency(calculateDiscount())}
                      </span>
                      {(discountType && discountValue) || (payment.discountType && payment.discountValue) ? (
                        <span className="text-xs text-gray-500 block">
                          ({discountType === 'percentage' ? `${discountValue}%` : discountType === 'absolute' ? `L ${discountValue}` : payment.discountType === 'percentage' ? `${payment.discountValue}%` : `L ${payment.discountValue}`})
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
                
                {/* Subtotal con descuento */}
                {calculateDiscount() > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Subtotal con descuento:</span>
                    <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                </div>
                )}
                
                {/* ISV */}
                <div className="flex items-center justify-between text-sm text-gray-700">
                  <span>ISV (15%):</span>
                  <span className="font-medium">{formatCurrency(calculateISV())}</span>
                </div>
                
                {/* Separador */}
                <div className="h-px bg-gray-300 my-2"></div>
                
                {/* Total */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-[#2E9589]">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>

                {/* Reembolsos */}
                {payment.refunds && payment.refunds.length > 0 && (
                  <>
                    <div className="h-px bg-red-200 my-3"></div>
                    {payment.refunds.map((refund, idx) => (
                      <div key={refund.id} className="flex items-center justify-between text-sm">
                        <span className="text-red-600">
                          Reembolso {idx + 1} - {new Date(refund.createdAt).toLocaleDateString("es-HN")}
                        </span>
                        <span className="font-semibold text-red-600">
                          - {formatCurrency(refund.amount)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-red-200">
                      <span className="text-lg font-bold text-gray-900">Total Neto:</span>
                      <span className="text-xl font-bold text-[#2E9589]">
                        {formatCurrency(calculateTotal() - (payment.refunds?.reduce((sum, r) => sum + r.amount, 0) || 0))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        {payment.status === "pendiente" && (
          <div className="flex justify-between pt-6 border-t-2 border-gray-300">
            <Button
              onClick={() => handleUpdateStatus("cancelado")}
              disabled={updating}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              {updating ? (
                <>
                  <InlineSpinner size="sm" className="mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <XCircle size={16} className="mr-2" />
                  Anular Factura
                </>
              )}
            </Button>
            <Button
              onClick={() => handleUpdateStatus("paid")}
              disabled={updating}
              size="lg"
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white px-8"
            >
              {updating ? (
                <>
                  <InlineSpinner size="sm" className="mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <Receipt size={18} className="mr-2" />
                  Facturar
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

