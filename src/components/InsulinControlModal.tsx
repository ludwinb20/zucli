"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Droplet } from "lucide-react";

interface InsulinControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId: string;
  onSave: () => void;
}

export default function InsulinControlModal({
  isOpen,
  onClose,
  hospitalizationId,
  onSave,
}: InsulinControlModalProps) {
  const [resultado, setResultado] = useState("");
  const [insulinaAdministrada, setInsulinaAdministrada] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setResultado("");
      setInsulinaAdministrada("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/hospitalizations/${hospitalizationId}/insulin-controls`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resultado: parseFloat(resultado),
            insulinaAdministrada: parseFloat(insulinaAdministrada),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al guardar control de insulina");
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar el control de insulina");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-[#2E9589]" />
              Registrar Control de Insulina
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Resultado (Glucosa) */}
          <div>
            <label htmlFor="resultado" className="block text-sm font-medium text-gray-700 mb-1">
              Resultado de Glucosa <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="resultado"
                value={resultado}
                onChange={(e) => setResultado(e.target.value)}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                placeholder="Ej: 120"
              />
              <span className="absolute right-3 top-2.5 text-sm text-gray-500">mg/dL</span>
            </div>
          </div>

          {/* Insulina Administrada */}
          <div>
            <label
              htmlFor="insulinaAdministrada"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Insulina Administrada <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                id="insulinaAdministrada"
                value={insulinaAdministrada}
                onChange={(e) => setInsulinaAdministrada(e.target.value)}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                placeholder="Ej: 5"
              />
              <span className="absolute right-3 top-2.5 text-sm text-gray-500">unidades</span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {isSaving ? "Guardando..." : "Guardar Control"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

