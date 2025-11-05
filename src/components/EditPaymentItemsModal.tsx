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
import { Package, Save, X, AlertTriangle, Plus } from "lucide-react";
import { PaymentWithRelations } from "@/types/payments";
import { TreatmentItem } from "@/types/components";
import { TreatmentItemsSelector } from "@/components/TreatmentItemsSelector";
import { PatientSearch } from "@/components/common/PatientSearch";
import { PatientModal } from "@/components/PatientModal";
import { Label } from "@/components/ui/label";
import { InlineSpinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CustomItemModal from "@/components/CustomItemModal";

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
  const [patientId, setPatientId] = useState<string>("");
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [editingCustomItem, setEditingCustomItem] = useState<TreatmentItem | null>(null);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Validar permisos
  const canEdit = user?.role?.name === 'caja' || user?.role?.name === 'admin';
  const isFromSale = payment?.saleId != null;

  // Cargar items del pago al abrir el modal
  useEffect(() => {
    if (payment && payment.items) {
      const mappedItems: TreatmentItem[] = payment.items.map((item) => ({
        id: item.id,
        type: item.isCustom ? 'custom' : (item.variantId ? 'variant' : 'price'),
        priceId: item.serviceItemId || null,
        variantId: item.variantId || undefined,
        name: item.nombre, // Usar snapshot
        description: item.notes || undefined,
        price: item.precioUnitario, // Usar snapshot
        quantity: item.quantity,
        isCustom: item.isCustom || false,
      }));
      setItems(mappedItems);
    }
    // Inicializar el patientId con el paciente actual
    if (payment?.patientId) {
      setPatientId(payment.patientId);
    }
  }, [payment]);

  if (!payment) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      // Validar que hay paciente seleccionado
      if (!patientId) {
        setError("Debe seleccionar un paciente");
        toast({
          title: "Error",
          description: "Debe seleccionar un paciente",
          variant: "error",
        });
        return;
      }

      // Validar que hay items
      if (items.length === 0) {
        setError("Debe tener al menos un item en el pago");
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
          patientId: patientId,
          items: items.map(item => ({
            priceId: item.isCustom ? null : item.priceId || null,
            variantId: item.variantId,
            nombre: item.name,
            precioUnitario: item.price,
            quantity: item.quantity,
            isCustom: item.isCustom || false,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el pago");
      }

      toast({
        title: "Éxito",
        description: "Pago actualizado correctamente",
        variant: "success",
      });

      onUpdate();
      handleClose();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el pago",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError("");
      onClose();
    }
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

          {/* Selector de Paciente */}
          {canEdit && isFromSale && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Paciente *
              </Label>
              <PatientSearch
                value={patientId}
                onChange={setPatientId}
                placeholder="Buscar paciente por nombre o identidad..."
                error={error && !patientId ? "Debe seleccionar un paciente" : ""}
                onAddNewPatient={() => setIsPatientModalOpen(true)}
              />
            </div>
          )}

          {/* Información del Paciente (solo lectura si no se puede editar) */}
          {(!canEdit || !isFromSale) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Paciente</p>
              <p className="font-semibold text-gray-900">
                {payment.patient.firstName} {payment.patient.lastName}
              </p>
              <p className="text-sm text-gray-600">
                ID: {payment.patient.identityNumber}
              </p>
            </div>
          )}

          {/* Editor de Items */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium text-gray-700">
                  Items del Pago
                </CardTitle>
                {canEdit && isFromSale && (
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
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-6 pb-6">
              <TreatmentItemsSelector
                items={items.filter(item => !item.isCustom)}
                onChange={(newItems) => {
                  const customItems = items.filter(item => item.isCustom);
                  setItems([...customItems, ...newItems]);
                }}
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
                        {canEdit && isFromSale && (
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
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      {/* Modal de Crear Paciente */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handlePatientCreated}
      />

      {/* Modal para agregar/editar item variable */}
      {canEdit && isFromSale && (
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
      )}
    </Dialog>
  );
}

