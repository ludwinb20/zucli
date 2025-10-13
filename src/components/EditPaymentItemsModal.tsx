"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, Save, X, AlertTriangle } from "lucide-react";
import { PaymentWithRelations } from "@/types/payments";
import { TreatmentItem } from "@/types/components";
import { TreatmentItemsSelector } from "@/components/TreatmentItemsSelector";
import { InlineSpinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface EditPaymentItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentWithRelations | null;
  onUpdate: () => void;
}

export default function EditPaymentItemsModal({
  isOpen,
  onClose,
  payment,
  onUpdate,
}: EditPaymentItemsModalProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const { toast } = useToast();

  // Validar permisos
  const canEdit = user?.role?.name === 'caja' || user?.role?.name === 'admin';
  const isFromSale = payment?.saleId != null;

  // Cargar items del pago al abrir el modal
  useEffect(() => {
    if (payment && payment.items) {
      const mappedItems: TreatmentItem[] = payment.items.map((item) => ({
        id: item.id,
        type: item.variantId ? 'variant' : 'price',
        priceId: item.serviceItemId,
        variantId: item.variantId || undefined,
        name: item.nombre, // Usar snapshot
        description: item.notes || undefined,
        price: item.precioUnitario, // Usar snapshot
        quantity: item.quantity,
      }));
      setItems(mappedItems);
    }
  }, [payment]);

  if (!payment) return null;

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validar que hay items
      if (items.length === 0) {
        toast({
          title: "Error",
          description: "Debe tener al menos un item en el pago",
          variant: "error",
        });
        return;
      }

      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map(item => ({
            priceId: item.priceId,
            variantId: item.variantId,
            nombre: item.name,
            precioUnitario: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el pago");
      }

      toast({
        title: "Éxito",
        description: "Items del pago actualizados correctamente",
        variant: "success",
      });

      onUpdate();
    } catch (error) {
      console.error("Error updating payment items:", error);
      toast({
        title: "Error",
        description: "Error al actualizar los items del pago",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900 flex items-center space-x-2">
            <Package size={24} className="text-[#2E9589]" />
            <span>Editar Items del Pago</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Advertencias */}
          {!canEdit && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Permisos Insuficientes</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Solo usuarios de Caja pueden editar items de pago.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!isFromSale && canEdit && (
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-orange-800">Edición No Permitida</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Este pago proviene de {payment.consultationId ? 'una Consulta Médica' : 'una Hospitalización'}. 
                    Los items deben editarse desde el módulo original.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Información del Paciente */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Paciente</p>
            <p className="font-semibold text-gray-900">
              {payment.patient.firstName} {payment.patient.lastName}
            </p>
            <p className="text-sm text-gray-600">
              ID: {payment.patient.identityNumber}
            </p>
          </div>

          {/* Editor de Items */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium text-gray-700">
                Items del Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-6 pb-6">
              <TreatmentItemsSelector
                items={items}
                onChange={setItems}
              />
            </CardContent>
          </Card>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X size={16} className="mr-2" />
              {canEdit && isFromSale ? 'Cancelar' : 'Cerrar'}
            </Button>
            {canEdit && isFromSale && (
              <Button
                onClick={handleSave}
                disabled={saving || items.length === 0}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                {saving ? (
                  <>
                    <InlineSpinner size="sm" className="mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

