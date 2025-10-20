"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardList } from "lucide-react";
import { CreateNursingNoteData } from "@/types/hospitalization";

interface NursingNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId?: string;
  onSave: (id: string, data: CreateNursingNoteData) => Promise<void>;
  isLoading?: boolean;
}

export default function NursingNoteModal({
  isOpen,
  onClose,
  hospitalizationId,
  onSave,
  isLoading = false,
}: NursingNoteModalProps) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hospitalizationId) return;

    // Validar que el contenido no esté vacío
    if (!content.trim()) {
      alert("La nota de enfermería no puede estar vacía");
      return;
    }

    const data: CreateNursingNoteData = {
      content: content.trim(),
    };

    await onSave(hospitalizationId, data);
    handleClose();
  };

  const handleClose = () => {
    setContent("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Registrar Nota de Enfermería
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de contenido */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              Nota de Enfermería *
            </Label>
            <Textarea
              id="content"
              placeholder="Escriba aquí las observaciones, cuidados, administración de medicamentos, cambios en el estado del paciente, etc..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none"
              required
            />
            <p className="text-xs text-gray-500">
              Describa detalladamente las observaciones y cuidados proporcionados al paciente.
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !content.trim()}
              className="gap-2 bg-[#2E9589] text-white hover:bg-[#2E9589]/90"
            >
              <ClipboardList className="h-4 w-4 " />
              {isLoading ? "Guardando..." : "Guardar Nota"}
           </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
