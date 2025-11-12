"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pill } from "lucide-react";
import { CreateMedicationControlData } from "@/types/hospitalization";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineSpinner } from "@/components/ui/spinner";
import type { MedicationName } from "@/types/medications";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MedicationControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId?: string;
  onSave: (id: string, data: CreateMedicationControlData) => Promise<void>;
  isLoading?: boolean;
}

interface MedicationEntry {
  id: string;
  medicationNameId: string;
  name: string;
  quantity: number;
}

export default function MedicationControlModal({
  isOpen,
  onClose,
  hospitalizationId,
  onSave,
  isLoading = false,
}: MedicationControlModalProps) {
  const [medicationNames, setMedicationNames] = useState<MedicationName[]>([]);
  const [medicationsLoading, setMedicationsLoading] = useState(false);
  const [entries, setEntries] = useState<MedicationEntry[]>([]);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");

  useEffect(() => {
    if (isOpen) {
      loadMedicationNames();
      setEntries([]);
      setSelectedMedicationId("");
      setQuantity("1");
    }
  }, [isOpen]);

  const loadMedicationNames = async () => {
    try {
      setMedicationsLoading(true);
      const response = await fetch("/api/medication-names");
      if (!response.ok) {
        throw new Error("Error al cargar medicamentos");
      }
      const data = await response.json();
      setMedicationNames(data.medications || []);
    } catch (error) {
      console.error("Error loading medication names:", error);
      setMedicationNames([]);
    } finally {
      setMedicationsLoading(false);
    }
  };

  const handleAddEntry = () => {
    if (!selectedMedicationId) {
      return;
    }

    const medication = medicationNames.find((m) => m.id === selectedMedicationId);
    if (!medication) {
      return;
    }

    const qty = Math.max(1, parseInt(quantity) || 1);

    setEntries((prev) => {
      const existing = prev.find((entry) => entry.medicationNameId === selectedMedicationId);
      if (existing) {
        return prev.map((entry) =>
          entry.medicationNameId === selectedMedicationId
            ? { ...entry, quantity: entry.quantity + qty }
            : entry
        );
      }
      return [
        ...prev,
        {
          id: `${selectedMedicationId}-${Date.now()}`,
          medicationNameId: selectedMedicationId,
          name: medication.name,
          quantity: qty,
        },
      ];
    });

    setQuantity("1");
    setSelectedMedicationId("");
  };

  const handleQuantityChange = (entryId: string, newQuantity: number) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, quantity: Math.max(1, newQuantity || 1) }
          : entry
      )
    );
  };

  const handleRemoveEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hospitalizationId) return;

    // Validar que hay al menos un item
    if (entries.length === 0) {
      alert("Debe agregar al menos un medicamento o servicio");
      return;
    }

    // Convertir TreatmentItems a CreateMedicationControlItemData
    const data: CreateMedicationControlData = {
      items: entries.map((entry) => ({
        medicationNameId: entry.medicationNameId,
        quantity: entry.quantity,
      })),
    };

    console.log('Guardando medication control:', data);

    await onSave(hospitalizationId, data);
    handleClose();
  };

  const handleClose = () => {
    setEntries([]);
    setSelectedMedicationId("");
    setQuantity("1");
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
          {/* Selector de Medicamentos */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Agregar medicamento</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Select
                  value={selectedMedicationId || ""}
                  onValueChange={(value) => setSelectedMedicationId(value)}
                >
                  <SelectTrigger disabled={medicationsLoading}>
                    <SelectValue placeholder={medicationsLoading ? "Cargando..." : "Seleccionar medicamento"} />
                  </SelectTrigger>
                  <SelectContent>
                    {medicationNames.map((medication) => (
                      <SelectItem key={medication.id} value={medication.id}>
                        {medication.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full"
                />
                <Button type="button" onClick={handleAddEntry} disabled={!selectedMedicationId}>
                  Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de medicamentos agregados */}
          {entries.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Medicamentos agregados ({entries.length})
              </Label>
              <div className="space-y-2">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{entry.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-gray-500">Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={entry.quantity}
                        onChange={(e) => handleQuantityChange(entry.id, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEntry(entry.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : medicationsLoading ? (
            <div className="flex items-center justify-center py-6">
              <InlineSpinner />
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500">
              No hay medicamentos agregados. Seleccione un medicamento del catálogo para comenzar.
            </div>
          )}

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
              disabled={isLoading || entries.length === 0}
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
