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
import { Input } from "@/components/ui/input";
import { FileText, X, Save } from "lucide-react";
import { CreateOperativeNoteData, OperativeNote } from "@/types/surgery";
import { useToast } from "@/hooks/use-toast";

interface OperativeNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgeryId: string;
  existingNote?: OperativeNote | null;
  onSave: () => void;
}

export default function OperativeNoteModal({
  isOpen,
  onClose,
  surgeryId,
  existingNote,
  onSave,
}: OperativeNoteModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOperativeNoteData>({
    diagnosticoPreoperatorio: "",
    ayudante: "",
    anestesia: "",
    circulante: "",
    instrumentalista: "",
    sangrado: "",
    complicaciones: "",
    conteoMaterial: "",
    hallazgos: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (existingNote) {
        setFormData({
          diagnosticoPreoperatorio: existingNote.diagnosticoPreoperatorio || "",
          ayudante: existingNote.ayudante || "",
          anestesia: existingNote.anestesia || "",
          circulante: existingNote.circulante || "",
          instrumentalista: existingNote.instrumentalista || "",
          sangrado: existingNote.sangrado || "",
          complicaciones: existingNote.complicaciones || "",
          conteoMaterial: existingNote.conteoMaterial || "",
          hallazgos: existingNote.hallazgos || "",
        });
      } else {
        setFormData({
          diagnosticoPreoperatorio: "",
          ayudante: "",
          anestesia: "",
          circulante: "",
          instrumentalista: "",
          sangrado: "",
          complicaciones: "",
          conteoMaterial: "",
          hallazgos: "",
        });
      }
    }
  }, [isOpen, existingNote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.diagnosticoPreoperatorio.trim()) {
      toast({
        title: "Campo requerido",
        description: "El diagnóstico preoperatorio es requerido",
        variant: "error",
      });
      return;
    }

    try {
      setIsLoading(true);

      const method = existingNote ? "PUT" : "POST";
      const response = await fetch(`/api/surgeries/${surgeryId}/operative-note`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar nota operatoria");
      }

      toast({
        title: "Éxito",
        description: existingNote 
          ? "Nota operatoria actualizada correctamente"
          : "Nota operatoria creada correctamente",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2E9589]" />
            {existingNote ? "Editar Nota Operatoria" : "Registrar Nota Operatoria"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Diagnóstico Preoperatorio */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="diagnosticoPreoperatorio" className="text-sm font-medium text-gray-700">
                Diagnóstico Preoperatorio <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="diagnosticoPreoperatorio"
                value={formData.diagnosticoPreoperatorio}
                onChange={(e) => setFormData(prev => ({ ...prev, diagnosticoPreoperatorio: e.target.value }))}
                placeholder="Diagnóstico antes de la cirugía..."
                rows={3}
                className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>

            {/* Ayudante */}
            <div className="space-y-2">
              <Label htmlFor="ayudante" className="text-sm font-medium text-gray-700">Ayudante</Label>
              <Input
                id="ayudante"
                value={formData.ayudante}
                onChange={(e) => setFormData(prev => ({ ...prev, ayudante: e.target.value }))}
                placeholder="Nombre del ayudante..."
                className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>

            {/* Anestesia */}
            <div className="space-y-2">
              <Label htmlFor="anestesia" className="text-sm font-medium text-gray-700">Anestesia</Label>
              <Input
                id="anestesia"
                value={formData.anestesia}
                onChange={(e) => setFormData(prev => ({ ...prev, anestesia: e.target.value }))}
                placeholder="Tipo de anestesia..."
                className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>

            {/* Circulante */}
            <div className="space-y-2">
              <Label htmlFor="circulante" className="text-sm font-medium text-gray-700">Circulante</Label>
              <Input
                id="circulante"
                value={formData.circulante}
                onChange={(e) => setFormData(prev => ({ ...prev, circulante: e.target.value }))}
                placeholder="Nombre del circulante..."
                className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>

            {/* Instrumentalista */}
            <div className="space-y-2">
              <Label htmlFor="instrumentalista" className="text-sm font-medium text-gray-700">Instrumentalista</Label>
              <Input
                id="instrumentalista"
                value={formData.instrumentalista}
                onChange={(e) => setFormData(prev => ({ ...prev, instrumentalista: e.target.value }))}
                placeholder="Nombre del instrumentalista..."
                className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>

            {/* Sangrado */}
            <div className="space-y-2">
              <Label htmlFor="sangrado" className="text-sm font-medium text-gray-700">Sangrado</Label>
              <Input
                id="sangrado"
                value={formData.sangrado}
                onChange={(e) => setFormData(prev => ({ ...prev, sangrado: e.target.value }))}
                placeholder="Cantidad de sangrado..."
                className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>

            {/* Complicaciones */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="complicaciones" className="text-sm font-medium text-gray-700">Complicaciones</Label>
              <Textarea
                id="complicaciones"
                value={formData.complicaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, complicaciones: e.target.value }))}
                placeholder="Describa cualquier complicación durante la cirugía..."
                rows={3}
                className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>

            {/* Conteo de Material */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="conteoMaterial" className="text-sm font-medium text-gray-700">Conteo de Material</Label>
              <Textarea
                id="conteoMaterial"
                value={formData.conteoMaterial}
                onChange={(e) => setFormData(prev => ({ ...prev, conteoMaterial: e.target.value }))}
                placeholder="Conteo de gasas, instrumental, etc..."
                rows={2}
                className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>

            {/* Hallazgos */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="hallazgos" className="text-sm font-medium text-gray-700">Hallazgos</Label>
              <Textarea
                id="hallazgos"
                value={formData.hallazgos}
                onChange={(e) => setFormData(prev => ({ ...prev, hallazgos: e.target.value }))}
                placeholder="Hallazgos quirúrgicos..."
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
              {isLoading ? "Guardando..." : existingNote ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

