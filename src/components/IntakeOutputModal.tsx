"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Utensils } from "lucide-react";
import { IntakeType, ExcretaType, IntakeOutputType } from "@/types";

interface IntakeOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId: string;
  onSave: () => void;
}

export default function IntakeOutputModal({
  isOpen,
  onClose,
  hospitalizationId,
  onSave,
}: IntakeOutputModalProps) {
  const [type, setType] = useState<IntakeOutputType>("ingesta");
  const [ingestaType, setIngestaType] = useState<IntakeType>("oral");
  const [cantidad, setCantidad] = useState("");
  const [excretaType, setExcretaType] = useState<ExcretaType>("orina");
  const [isSaving, setIsSaving] = useState(false);

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setType("ingesta");
      setIngestaType("oral");
      setCantidad("");
      setExcretaType("orina");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const data: Record<string, string | number> = {
        type,
      };

      if (type === "ingesta") {
        data.ingestaType = ingestaType;
        data.cantidad = parseFloat(cantidad);
      } else {
        data.excretaType = excretaType;
      }

      const response = await fetch(
        `/api/hospitalizations/${hospitalizationId}/intake-output`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error("Error al guardar control");
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar el control de ingesta/excreta");
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
              <Utensils className="h-5 w-5 text-[#2E9589]" />
              Registrar Ingesta o Excreta
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
          {/* Tipo: Ingesta o Excreta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="ingesta"
                  checked={type === "ingesta"}
                  onChange={(e) => setType(e.target.value as IntakeOutputType)}
                  className="w-4 h-4 text-[#2E9589]"
                />
                <span className="text-sm">Ingesta</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="excreta"
                  checked={type === "excreta"}
                  onChange={(e) => setType(e.target.value as IntakeOutputType)}
                  className="w-4 h-4 text-[#2E9589]"
                />
                <span className="text-sm">Excreta</span>
              </label>
            </div>
          </div>

          {/* Campos para Ingesta */}
          {type === "ingesta" && (
            <>
              <div>
                <label htmlFor="ingestaType" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Ingesta <span className="text-red-500">*</span>
                </label>
                <select
                  id="ingestaType"
                  value={ingestaType}
                  onChange={(e) => setIngestaType(e.target.value as IntakeType)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                >
                  <option value="oral">Oral</option>
                  <option value="parenteral">Parenteral</option>
                </select>
              </div>

              <div>
                <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                    placeholder="Ej: 250"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500">ml</span>
                </div>
              </div>
            </>
          )}

          {/* Campos para Excreta */}
          {type === "excreta" && (
            <div>
              <label htmlFor="excretaType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Excreta <span className="text-red-500">*</span>
              </label>
              <select
                id="excretaType"
                value={excretaType}
                onChange={(e) => setExcretaType(e.target.value as ExcretaType)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              >
                <option value="orina">Orina</option>
                <option value="heces">Heces</option>
                <option value="vomitos">Vómitos</option>
                <option value="sng">S.N.G</option>
                <option value="drenaje">Drenaje</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          )}

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

