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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { InlineSpinner } from "@/components/ui/spinner";
import { SearchableSelect } from "@/components/common/SearchableSelect";
import { PatientSearch } from "@/components/common/PatientSearch";
import { PatientModal } from "@/components/PatientModal";
import { TreatmentItemsSelector } from "@/components/TreatmentItemsSelector";
import { TreatmentItem } from "@/types/components";
import { Save, X, Activity } from "lucide-react";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  identityNumber: string;
}

interface SurgeryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function SurgeryModal({
  isOpen,
  onClose,
  onSave,
}: SurgeryModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const [surgeryTagId, setSurgeryTagId] = useState<string>("");

  const [formData, setFormData] = useState({
    patientId: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      setFormData({
        patientId: "",
      });
      setItems([]);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      // Cargar pacientes
      const patientsRes = await fetch("/api/patients?limit=1000");
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData.patients || []);
      }

      // Cargar tag de cirugía
      const tagsRes = await fetch("/api/tags");
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        console.log('tagsData', tagsData);
        const surgeryTag = tagsData.tags?.find((t: { id: string; name: string }) => 
          t.name.toLowerCase() === 'cirugias' || t.name.toLowerCase() === 'cirugías'
        );
        if (surgeryTag) {
          console.log('surgeryTag', surgeryTag);
          setSurgeryTagId(surgeryTag.id); // ← Usar ID, no name
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.patientId) {
      toast({
        title: "Error",
        description: "Selecciona un paciente",
        variant: "error",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un procedimiento quirúrgico",
        variant: "error",
      });
      return;
    }

    try {
      setSaving(true);

      // Tomar el primer item (solo se permite uno)
      const surgeryItem = items[0];

      const response = await fetch("/api/surgeries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: formData.patientId,
          surgeryItemId: surgeryItem.priceId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear cirugía");
      }

      toast({
        title: "Éxito",
        description: "Cirugía creada exitosamente",
      });

      onSave();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear cirugía",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handler para crear paciente
  const handlePatientCreated = async (data: unknown) => {
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear paciente");

      const newPatient = await response.json();
      
      // Seleccionar automáticamente el nuevo paciente
      setFormData(prev => ({
        ...prev,
        patientId: newPatient.id
      }));
      
      // Cerrar el modal de paciente
      setIsPatientModalOpen(false);
      
      // Mostrar toast de éxito
      toast({
        title: "Paciente creado",
        description: "El paciente ha sido agregado exitosamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el paciente",
        variant: "error",
      });
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-[#2E9589]" />
            Nueva Cirugía
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Paciente */}
          <div className="space-y-2">
            <PatientSearch
              value={formData.patientId}
              onChange={(value) => setFormData({ ...formData, patientId: value })}
              placeholder="Buscar paciente..."
              label="Paciente *"
              onAddNewPatient={() => setIsPatientModalOpen(true)}
            />
          </div>

          {/* Procedimiento Quirúrgico */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Procedimiento Quirúrgico *
            </Label>
            <TreatmentItemsSelector
              items={items}
              onChange={(newItems) => {
                // Limitar a solo 1 item
                if (newItems.length > 1) {
                  setItems([newItems[newItems.length - 1]]);
                } else {
                  setItems(newItems);
                }
              }}
              includeTags={surgeryTagId ? [surgeryTagId] : undefined}
            />
            <p className="text-xs text-gray-500">
              Solo se puede seleccionar un procedimiento quirúrgico
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            {saving ? (
              <InlineSpinner className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Cirugía
          </Button>
        </div>
      </DialogContent>

      {/* Modal anidado para crear paciente */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patient={null}
        onSave={handlePatientCreated}
      />
    </Dialog>
  );
}

