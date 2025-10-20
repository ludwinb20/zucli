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
import { CreateSafetyChecklistEntradaData, SafetyChecklistEntrada } from "@/types/surgery";
import { useToast } from "@/hooks/use-toast";

interface SafetyChecklistEntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgeryId: string;
  existingChecklist?: SafetyChecklistEntrada | null;
  onSave: () => void;
}

export default function SafetyChecklistEntradaModal({
  isOpen,
  onClose,
  surgeryId,
  existingChecklist,
  onSave,
}: SafetyChecklistEntradaModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSafetyChecklistEntradaData>({
    confirmaIdentidad: false,
    confirmaLocalizacion: false,
    confirmaProcedimiento: false,
    confirmaConsentimiento: false,
    confirmaMarca: false,
    verificacionSeguridad: false,
    alergiasConocidas: false,
    detallesAlergias: "",
    dificultadViaArea: false,
    accesoIVAdecuado: false,
    esterilidad: false,
    profilaxisAntibiotica: false,
    imagenesEsenciales: false,
  });

  useEffect(() => {
    if (isOpen && existingChecklist) {
      setFormData({
        confirmaIdentidad: existingChecklist.confirmaIdentidad,
        confirmaLocalizacion: existingChecklist.confirmaLocalizacion,
        confirmaProcedimiento: existingChecklist.confirmaProcedimiento,
        confirmaConsentimiento: existingChecklist.confirmaConsentimiento,
        confirmaMarca: existingChecklist.confirmaMarca,
        verificacionSeguridad: existingChecklist.verificacionSeguridad,
        alergiasConocidas: existingChecklist.alergiasConocidas,
        detallesAlergias: existingChecklist.detallesAlergias || "",
        dificultadViaArea: existingChecklist.dificultadViaArea,
        accesoIVAdecuado: existingChecklist.accesoIVAdecuado,
        esterilidad: existingChecklist.esterilidad,
        profilaxisAntibiotica: existingChecklist.profilaxisAntibiotica,
        imagenesEsenciales: existingChecklist.imagenesEsenciales,
      });
    }
  }, [isOpen, existingChecklist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const method = existingChecklist ? "PUT" : "POST";
      const response = await fetch(`/api/surgeries/${surgeryId}/safety-checklist/entrada`, {
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
        description: "Lista de verificación (Entrada) guardada correctamente",
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

  const CheckboxField = ({ label, field }: { label: string; field: keyof CreateSafetyChecklistEntradaData }) => (
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
            Lista de Verificación - Entrada (Antes de Anestesia)
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* El paciente a confirmado */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">El paciente ha confirmado:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CheckboxField label="Su identidad" field="confirmaIdentidad" />
              <CheckboxField label="Localización quirúrgica" field="confirmaLocalizacion" />
              <CheckboxField label="El procedimiento" field="confirmaProcedimiento" />
              <CheckboxField label="Consentimiento informado" field="confirmaConsentimiento" />
              <CheckboxField label="Marca en el lugar del cuerpo" field="confirmaMarca" />
              <CheckboxField label="Verificación de la seguridad" field="verificacionSeguridad" />
            </div>
          </div>

          {/* Tiene el paciente */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Tiene el paciente:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CheckboxField label="Alergias conocidas" field="alergiasConocidas" />
              <CheckboxField label="Dificultad en la vía aérea" field="dificultadViaArea" />
              <CheckboxField label="Acceso IV adecuado / Fluidos necesarios" field="accesoIVAdecuado" />
              <CheckboxField label="Esterilidad revisada" field="esterilidad" />
              <CheckboxField label="Profilaxis antibiótica (últimos 60 min)" field="profilaxisAntibiotica" />
              <CheckboxField label="Imágenes diagnósticas esenciales" field="imagenesEsenciales" />
            </div>
          </div>

          {/* Detalles de alergias */}
          {formData.alergiasConocidas && (
            <div className="space-y-2">
              <Label htmlFor="detallesAlergias" className="text-sm font-medium text-gray-700">
                ¿Cuáles alergias?
              </Label>
              <Textarea
                id="detallesAlergias"
                value={formData.detallesAlergias}
                onChange={(e) => setFormData(prev => ({ ...prev, detallesAlergias: e.target.value }))}
                placeholder="Describa las alergias del paciente..."
                rows={2}
                className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>
          )}

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

