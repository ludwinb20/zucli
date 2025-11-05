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
import { Save, X, ShoppingCart, Activity, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CustomItemModal from "@/components/CustomItemModal";

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
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [editingCustomItem, setEditingCustomItem] = useState<TreatmentItem | null>(null);
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
          priceId: item.isCustom ? null : item.priceId || null,
          variantId: item.variantId,
          nombre: item.name,
          precioUnitario: item.price,
          quantity: item.quantity,
          isCustom: item.isCustom || false,
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

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    // Los precios ya incluyen ISV, así que el total es simplemente la suma de items
    return calculateSubtotal();
  };

  // Handler para agregar item variable
  const handleAddCustomItem = (itemData: { name: string; price: number; quantity: number }) => {
    const newItem: TreatmentItem = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      priceId: null,
      name: itemData.name,
      price: itemData.price,
      quantity: itemData.quantity,
      isCustom: true,
    };
    setItems([...items, newItem]);
    setIsCustomItemModalOpen(false);
    setEditingCustomItem(null);
  };

  // Handler para editar item variable
  const handleEditCustomItem = (item: TreatmentItem) => {
    setEditingCustomItem(item);
    setIsCustomItemModalOpen(true);
  };

  // Handler para actualizar item variable editado
  const handleUpdateCustomItem = (itemData: { name: string; price: number; quantity: number }) => {
    if (!editingCustomItem) return;

    setItems(items.map(item =>
      item.id === editingCustomItem.id
        ? { ...item, name: itemData.name, price: itemData.price, quantity: itemData.quantity }
        : item
    ));
    setIsCustomItemModalOpen(false);
    setEditingCustomItem(null);
  };

  // Handler para eliminar item
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
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
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                Medicamentos y Servicios *
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCustomItem(null);
                  setIsCustomItemModalOpen(true);
                }}
                className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
              >
                <Plus size={16} className="mr-2" />
                Agregar Item Variable
              </Button>
            </div>
            <TreatmentItemsSelector
              items={items.filter(item => !item.isCustom)}
              onChange={(newItems) => {
                const customItems = items.filter(item => item.isCustom);
                setItems([...customItems, ...newItems]);
              }}
              includeTags={paymentType === 'radiology' && radiologyTagId ? [radiologyTagId] : undefined}
            />
            
            {/* Lista de items variables */}
            {items.filter(item => item.isCustom).length > 0 && (
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Items Variables
                </Label>
                <div className="space-y-2">
                  {items.filter(item => item.isCustom).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Cantidad: {item.quantity} × L {item.price.toFixed(2)} = L {(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCustomItem(item)}
                          className="text-[#2E9589] hover:text-[#2E9589]/80"
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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
                <p className="text-xs text-gray-500 mt-1">(ISV incluido)</p>
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

      {/* Modal para agregar/editar item variable */}
      <CustomItemModal
        isOpen={isCustomItemModalOpen}
        onClose={() => {
          setIsCustomItemModalOpen(false);
          setEditingCustomItem(null);
        }}
        onSave={editingCustomItem ? handleUpdateCustomItem : handleAddCustomItem}
        initialItem={editingCustomItem ? {
          name: editingCustomItem.name,
          price: editingCustomItem.price,
          quantity: editingCustomItem.quantity,
        } : null}
      />
    </Dialog>
  );
}

