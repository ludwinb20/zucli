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
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, X, Save } from "lucide-react";
import { CreateSafetyChecklistSalidaData, SafetyChecklistSalida } from "@/types/surgery";
import { useToast } from "@/hooks/use-toast";

interface SafetyChecklistSalidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgeryId: string;
  existingChecklist?: SafetyChecklistSalida | null;
  onSave: () => void;
}

export default function SafetyChecklistSalidaModal({
  isOpen,
  onClose,
  surgeryId,
  existingChecklist,
  onSave,
}: SafetyChecklistSalidaModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSafetyChecklistSalidaData>({
    nombreProcedimiento: false,
    conteoGasas: false,
    conteoAgujas: false,
    identificacionMuestras: false,
    problemasEquipo: false,
    profilaxisTromboembolia: false,
  });

  useEffect(() => {
    if (isOpen && existingChecklist) {
      setFormData({
        nombreProcedimiento: existingChecklist.nombreProcedimiento,
        conteoGasas: existingChecklist.conteoGasas,
        conteoAgujas: existingChecklist.conteoAgujas,
        identificacionMuestras: existingChecklist.identificacionMuestras,
        problemasEquipo: existingChecklist.problemasEquipo,
        profilaxisTromboembolia: existingChecklist.profilaxisTromboembolia,
      });
    }
  }, [isOpen, existingChecklist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const method = existingChecklist ? "PUT" : "POST";
      const response = await fetch(`/api/surgeries/${surgeryId}/safety-checklist/salida`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar lista de verificación");
      }

      toast({
        title: "Éxito",
        description: "Lista de verificación (Salida) guardada correctamente",
      });

      onSave();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const CheckboxField = ({ label, field }: { label: string; field: keyof CreateSafetyChecklistSalidaData }) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={field}
        checked={formData[field] as boolean || false}
        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [field]: !!checked }))}
      />
      <Label htmlFor={field} className="text-sm font-medium text-gray-700">{label}</Label>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#2E9589]" />
            Lista de Verificación - Salida (Cierre Quirúrgico)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* La enfermera confirma verbalmente */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">La enfermera confirma verbalmente con el equipo:</h3>
            <div className="grid grid-cols-1 gap-3">
              <CheckboxField 
                label="Nombre del procedimiento que se registra" 
                field="nombreProcedimiento" 
              />
              <CheckboxField label="Conteo de gasas correcto" field="conteoGasas" />
              <CheckboxField label="Conteo de agujas e instrumental correcto" field="conteoAgujas" />
              <CheckboxField 
                label="Identificación de muestras biológicas (incluyendo nombre del paciente)" 
                field="identificacionMuestras" 
              />
              <CheckboxField 
                label="Si existe algún problema que abordar en relación con el material o los equipos" 
                field="problemasEquipo" 
              />
              <CheckboxField 
                label="Se ha iniciado profilaxis de enfermedad tromboembólica venosa" 
                field="profilaxisTromboembolia" 
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Guardando..." : existingChecklist ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

