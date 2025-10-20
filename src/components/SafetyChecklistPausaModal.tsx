"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, X, Save } from "lucide-react";
import { CreateSafetyChecklistPausaData, SafetyChecklistPausa } from "@/types/surgery";
import { useToast } from "@/hooks/use-toast";

interface SafetyChecklistPausaModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgeryId: string;
  existingChecklist?: SafetyChecklistPausa | null;
  onSave: () => void;
}

export default function SafetyChecklistPausaModal({
  isOpen,
  onClose,
  surgeryId,
  existingChecklist,
  onSave,
}: SafetyChecklistPausaModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSafetyChecklistPausaData>({
    confirmacionEquipo: false,
    confirmaPaciente: false,
    confirmaSitio: false,
    confirmaProcedimiento: false,
    pasosCriticos: "",
    preocupacionesAnestesia: "",
  });

  useEffect(() => {
    if (isOpen && existingChecklist) {
      setFormData({
        confirmacionEquipo: existingChecklist.confirmacionEquipo,
        confirmaPaciente: existingChecklist.confirmaPaciente,
        confirmaSitio: existingChecklist.confirmaSitio,
        confirmaProcedimiento: existingChecklist.confirmaProcedimiento,
        pasosCriticos: existingChecklist.pasosCriticos || "",
        preocupacionesAnestesia: existingChecklist.preocupacionesAnestesia || "",
      });
    }
  }, [isOpen, existingChecklist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const method = existingChecklist ? "PUT" : "POST";
      const response = await fetch(`/api/surgeries/${surgeryId}/safety-checklist/pausa`, {
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
        description: "Lista de verificación (Pausa) guardada correctamente",
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

  const CheckboxField = ({ label, field }: { label: string; field: keyof CreateSafetyChecklistPausaData }) => (
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
            Lista de Verificación - Pausa (Antes de Incisión)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Confirmaciones */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Equipo confirma:</h3>
            <div className="grid grid-cols-1 gap-3">
              <CheckboxField 
                label="Todos los miembros se han identificado por su nombre y función" 
                field="confirmacionEquipo" 
              />
              <CheckboxField label="Confirman al paciente" field="confirmaPaciente" />
              <CheckboxField label="Confirman sitio quirúrgico" field="confirmaSitio" />
              <CheckboxField label="Confirman procedimiento" field="confirmaProcedimiento" />
            </div>
          </div>

          {/* Anticipación de sucesos críticos */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Anticipación de Sucesos Críticos:</h3>
            
            <div className="space-y-2">
              <Label htmlFor="pasosCriticos" className="text-sm font-medium text-gray-700">
                Cirujano/a repasa: ¿Cuáles son los pasos críticos, duración y pérdida de sangre esperada?
              </Label>
              <Textarea
                id="pasosCriticos"
                value={formData.pasosCriticos}
                onChange={(e) => setFormData(prev => ({ ...prev, pasosCriticos: e.target.value }))}
                placeholder="Describa los pasos críticos..."
                rows={3}
                className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preocupacionesAnestesia" className="text-sm font-medium text-gray-700">
                Anestesia repasa: ¿Presenta el paciente alguna peculiaridad que genere preocupaciones?
              </Label>
              <Textarea
                id="preocupacionesAnestesia"
                value={formData.preocupacionesAnestesia}
                onChange={(e) => setFormData(prev => ({ ...prev, preocupacionesAnestesia: e.target.value }))}
                placeholder="Describa preocupaciones de anestesia..."
                rows={3}
                className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
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

