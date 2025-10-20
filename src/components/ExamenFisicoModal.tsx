"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ExamenFisicoData } from "@/types/components";
import { Stethoscope } from "lucide-react";

interface ExamenFisicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId: string;
  onSave: (id: string, examenFisicoData: ExamenFisicoData) => Promise<void>;
}

export default function ExamenFisicoModal({
  isOpen,
  onClose,
  hospitalizationId,
  onSave,
}: ExamenFisicoModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExamenFisicoData>({
    aparienciaGeneral: "",
    cabeza: "",
    ojos: "",
    orl: "",
    torax: "",
    corazon: "",
    pulmones: "",
    abdomen: "",
    genitoUrinario: "",
    extremidades: "",
    osteoarticular: "",
    pielYPaneras: "",
    neurologicos: "",
    columna: "",
    comentarios: "",
    diagnostico: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar que al menos un campo tenga contenido
    const hasContent = Object.values(formData).some(value => value && value.trim() !== "");
    
    if (!hasContent) {
      toast({
        title: "Error",
        description: "Debe completar al menos un campo del examen físico",
        variant: "error",
      });
      return;
    }

    try {
      setLoading(true);
      await onSave(hospitalizationId, formData);
      
      toast({
        title: "Éxito",
        description: "Examen físico registrado correctamente",
      });
      
      // Resetear formulario
      setFormData({
        aparienciaGeneral: "",
        cabeza: "",
        ojos: "",
        orl: "",
        torax: "",
        corazon: "",
        pulmones: "",
        abdomen: "",
        genitoUrinario: "",
        extremidades: "",
        osteoarticular: "",
        pielYPaneras: "",
        neurologicos: "",
        columna: "",
        comentarios: "",
        diagnostico: "",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el examen físico",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const fieldLabels = {
    aparienciaGeneral: "Apariencia General",
    cabeza: "Cabeza",
    ojos: "Ojos",
    orl: "ORL",
    torax: "Tórax",
    corazon: "Corazón",
    pulmones: "Pulmones",
    abdomen: "Abdomen",
    genitoUrinario: "Genito-Urinario",
    extremidades: "Extremidades",
    osteoarticular: "Osteoarticular",
    pielYPaneras: "Piel y Paneras",
    neurologicos: "Neurológicos",
    columna: "Columna",
    comentarios: "Comentarios",
    diagnostico: "Diagnóstico",
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" />
            Registrar Examen Físico
          </DialogTitle>
          <DialogDescription>
            Complete los campos del examen físico. Todos los campos son opcionales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(fieldLabels).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-sm font-medium">
                  {label}
                </Label>
                <Textarea
                  id={key}
                  value={formData[key as keyof ExamenFisicoData] || ""}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  placeholder={`Ingrese observaciones de ${label.toLowerCase()}`}
                  className="min-h-[80px] resize-none"
                  disabled={loading}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white">
              {loading ? "Guardando..." : "Guardar Examen Físico"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
