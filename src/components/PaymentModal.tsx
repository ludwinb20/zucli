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
import { PatientSearch } from "@/components/common/PatientSearch";
import { PatientModal } from "@/components/PatientModal";
import { TreatmentItemsSelector } from "@/components/TreatmentItemsSelector";
import { TreatmentItem } from "@/types/components";
import { CreatePaymentData } from "@/types/payments";
import { Patient } from "@/types";
import { InlineSpinner } from "@/components/ui/spinner";
import { Save, X, ShoppingCart, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const [paymentType, setPaymentType] = useState<'sale' | 'radiology'>('sale');
  const [error, setError] = useState("");
  const [radiologyTagId, setRadiologyTagId] = useState<string>("");
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const { toast } = useToast();

  // Cargar configuración de radiología
  useEffect(() => {
    const loadRadiologyConfig = async () => {
      try {
        const response = await fetch("/api/config?key=radiology");
        if (response.ok) {
          const data = await response.json();
          setRadiologyTagId(data.value?.radiologyTagId || "");
        }
      } catch (error) {
        console.error("Error loading radiology config:", error);
      }
    };

    if (isOpen) {
      loadRadiologyConfig();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      // Validar que hay paciente seleccionado
      if (!patientId) {
        setError("Debe seleccionar un paciente");
        return;
      }

      // Validar que hay items
      if (items.length === 0) {
        setError("Debe agregar al menos un item al pago");
        return;
      }

      setSaving(true);
      setError("");

      // Preparar datos para enviar (con snapshot)
      const paymentData: CreatePaymentData = {
        patientId,
        type: paymentType,
        items: items.map(item => ({
          priceId: item.priceId,
          variantId: item.variantId,
          nombre: item.name,
          precioUnitario: item.price,
          quantity: item.quantity,
        })),
      };

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error("Error al crear el pago");
      }

      // Éxito
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error saving payment:", error);
      setError("Error al guardar el pago. Por favor intente de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setPatientId("");
      setItems([]);
      setPaymentType('sale');
      setError("");
      onClose();
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Handler para crear paciente
  const handlePatientCreated = async (data: unknown) => {
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear paciente");

      const newPatient = await response.json();
      
      // Seleccionar automáticamente el nuevo paciente
      setPatientId(newPatient.id);
      
      // Cerrar el modal de paciente
      setIsPatientModalOpen(false);
      
      // Mostrar toast de éxito
      toast({
        title: "Paciente creado",
        description: "El paciente ha sido agregado exitosamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el paciente",
        variant: "error",
      });
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Crear Nuevo Pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de Pago */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Tipo de Pago *
            </Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentType('sale')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  paymentType === 'sale'
                    ? 'border-[#2E9589] bg-[#2E9589]/10 text-[#2E9589]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="font-medium">Venta Normal</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('radiology')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  paymentType === 'radiology'
                    ? 'border-[#2E9589] bg-[#2E9589]/10 text-[#2E9589]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Activity className="h-5 w-5" />
                  <span className="font-medium">Rayos X / Radiología</span>
                </div>
              </button>
            </div>
          </div>

          {/* Selector de Paciente */}
          <div className="space-y-2">
            <PatientSearch
              value={patientId}
              onChange={setPatientId}
              placeholder="Buscar paciente por nombre o identidad..."
              error={error && !patientId ? "Debe seleccionar un paciente" : ""}
              onAddNewPatient={() => setIsPatientModalOpen(true)}
            />
          </div>

          {/* Selector de Items */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Medicamentos y Servicios *
            </Label>
            <TreatmentItemsSelector
              items={items}
              onChange={setItems}
              includeTags={paymentType === 'radiology' && radiologyTagId ? [radiologyTagId] : undefined}
            />
            {error && items.length === 0 && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          {/* Total */}
          {items.length > 0 && (
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total del Pago</p>
                <p className="text-2xl font-bold text-[#2E9589]">
                  L {calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Error general */}
          {error && patientId && items.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !patientId || items.length === 0}
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
                  Crear Pago
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal anidado para crear paciente */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patient={null}
        onSave={handlePatientCreated}
      />
    </Dialog>
  );
}

