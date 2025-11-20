"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { InlineSpinner } from "@/components/ui/spinner";
import { PatientSearch } from "@/components/common/PatientSearch";
import { PatientModal } from "@/components/PatientModal";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Activity } from "lucide-react";

interface SurgeryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function SurgeryModal({
  isOpen,
  onClose,
  onSave,
}: SurgeryModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    patientId: "",
    nombre: "", // Concepto de la cirugía
    precioUnitario: "", // Precio unitario
    quantity: "1", // Cantidad (por defecto 1)
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFormData({
        patientId: "",
        nombre: "",
        precioUnitario: "",
        quantity: "1",
      });
    }
  }, [isOpen]);

  const loadData = async () => {
    // No necesitamos cargar pacientes aquí ya que PatientSearch lo maneja
    // Esta función se mantiene por compatibilidad pero está vacía
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.patientId) {
      toast({
        title: "Error",
        description: "Selecciona un paciente",
        variant: "error",
      });
      return;
    }

    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El concepto de la cirugía es requerido",
        variant: "error",
      });
      return;
    }

    const precioNum = parseFloat(formData.precioUnitario);
    if (isNaN(precioNum) || precioNum <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser mayor a 0",
        variant: "error",
      });
      return;
    }

    const quantityNum = parseInt(formData.quantity) || 1;
    if (quantityNum <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser mayor a 0",
        variant: "error",
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/surgeries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: formData.patientId,
          nombre: formData.nombre.trim(),
          precioUnitario: precioNum,
          quantity: quantityNum,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear cirugía");
      }

      toast({
        title: "Éxito",
        description: "Cirugía creada exitosamente",
      });

      onSave();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear cirugía",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
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
      setFormData(prev => ({
        ...prev,
        patientId: newPatient.id
      }));
      
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#2E9589]" />
            Nueva Cirugía
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Paciente */}
          <div className="space-y-2">
            <PatientSearch
              value={formData.patientId}
              onChange={(value) => setFormData({ ...formData, patientId: value })}
              placeholder="Buscar paciente..."
              label="Paciente *"
              onAddNewPatient={() => setIsPatientModalOpen(true)}
            />
          </div>

          {/* Concepto de la Cirugía */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-medium text-gray-700">
              Concepto de la Cirugía *
            </Label>
            <Textarea
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Osteomía de Cherron, Apendicectomía, etc."
              rows={3}
              className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
            />
            <p className="text-xs text-gray-500">
              Describe el procedimiento quirúrgico que se realizará
            </p>
          </div>

          {/* Precio y Cantidad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precioUnitario" className="text-sm font-medium text-gray-700">
                Precio Unitario (ISV incluido) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  L
                </span>
                <Input
                  id="precioUnitario"
                  type="number"
                  value={formData.precioUnitario}
                  onChange={(e) => setFormData({ ...formData, precioUnitario: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="pl-8 border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                Cantidad *
              </Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
                min="1"
                step="1"
                className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>
          </div>

          {/* Resumen */}
          {formData.precioUnitario && formData.quantity && (
            <div className="p-3 bg-[#2E9589]/10 rounded-lg border border-[#2E9589]/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-lg font-bold text-[#2E9589]">
                  L {(parseFloat(formData.precioUnitario || "0") * parseInt(formData.quantity || "1")).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            {saving ? (
              <InlineSpinner className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Cirugía
          </Button>
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

