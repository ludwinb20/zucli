"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";
import { CreateMedicationControlData } from "@/types/hospitalization";
import { TreatmentItem } from "@/types/components";
import { CompactItemSelector } from "@/components/CompactItemSelector";

interface MedicationControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId?: string;
  onSave: (id: string, data: CreateMedicationControlData) => Promise<void>;
  isLoading?: boolean;
}

export default function MedicationControlModal({
  isOpen,
  onClose,
  hospitalizationId,
  onSave,
  isLoading = false,
}: MedicationControlModalProps) {
  const [items, setItems] = useState<TreatmentItem[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hospitalizationId) return;

    // Validar que hay al menos un item
    if (items.length === 0) {
      alert("Debe agregar al menos un medicamento o servicio");
      return;
    }

    // Convertir TreatmentItems a CreateMedicationControlItemData
    const data: CreateMedicationControlData = {
      items: items.map(item => ({
        serviceItemId: item.priceId, // priceId en TreatmentItem es el serviceItemId
        variantId: item.variantId || undefined,
        quantity: item.quantity,
      })),
    };

    console.log('Guardando medication control:', data);

    await onSave(hospitalizationId, data);
    handleClose();
  };

  const handleClose = () => {
    setItems([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-indigo-600" />
            Registrar Control de Medicamentos
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de Items */}
          <CompactItemSelector
            items={items}
            onChange={setItems}
            prioritizeTags={["hospitalizacion"]}
          />

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
              disabled={isLoading || items.length === 0}
              className="gap-2 bg-[#2E9589] text-white hover:bg-[#2E9589]/90"
            >
              <Pill className="h-4 w-4" />
              {isLoading ? "Guardando..." : "Guardar Control"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
