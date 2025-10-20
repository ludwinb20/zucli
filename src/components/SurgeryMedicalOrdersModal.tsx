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
import { ClipboardList, X, Save, Plus, Trash2 } from "lucide-react";
import { CreateSurgeryMedicalOrdersData, SurgeryMedicalOrders } from "@/types/surgery";
import { useToast } from "@/hooks/use-toast";

interface SurgeryMedicalOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgeryId: string;
  existingOrders?: SurgeryMedicalOrders | null;
  onSave: () => void;
}

export default function SurgeryMedicalOrdersModal({
  isOpen,
  onClose,
  surgeryId,
  existingOrders,
  onSave,
}: SurgeryMedicalOrdersModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [anotaciones, setAnotaciones] = useState<string[]>([""]);
  const [ordenes, setOrdenes] = useState<string[]>([""]);

  useEffect(() => {
    if (isOpen) {
      if (existingOrders) {
        setAnotaciones(
          existingOrders.anotaciones.length > 0
            ? existingOrders.anotaciones.map(a => a.content)
            : [""]
        );
        setOrdenes(
          existingOrders.ordenes.length > 0
            ? existingOrders.ordenes.map(o => o.content)
            : [""]
        );
      } else {
        setAnotaciones([""]);
        setOrdenes([""]);
      }
    }
  }, [isOpen, existingOrders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validAnotaciones = anotaciones.filter(a => a.trim());
    const validOrdenes = ordenes.filter(o => o.trim());

    if (validAnotaciones.length === 0 && validOrdenes.length === 0) {
      toast({
        title: "Campos requeridos",
        description: "Debe agregar al menos una anotación u orden",
        variant: "error",
      });
      return;
    }

    try {
      setIsLoading(true);

      const method = existingOrders ? "PUT" : "POST";
      const response = await fetch(`/api/surgeries/${surgeryId}/medical-orders`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anotaciones: validAnotaciones,
          ordenes: validOrdenes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      toast({
        title: "Éxito",
        description: existingOrders
          ? "Órdenes y anotaciones actualizadas correctamente"
          : "Órdenes y anotaciones creadas correctamente",
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

  const addAnotacion = () => setAnotaciones([...anotaciones, ""]);
  const removeAnotacion = (index: number) => setAnotaciones(anotaciones.filter((_, i) => i !== index));
  const updateAnotacion = (index: number, value: string) => {
    const newAnotaciones = [...anotaciones];
    newAnotaciones[index] = value;
    setAnotaciones(newAnotaciones);
  };

  const addOrden = () => setOrdenes([...ordenes, ""]);
  const removeOrden = (index: number) => setOrdenes(ordenes.filter((_, i) => i !== index));
  const updateOrden = (index: number, value: string) => {
    const newOrdenes = [...ordenes];
    newOrdenes[index] = value;
    setOrdenes(newOrdenes);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[#2E9589]" />
            {existingOrders ? "Editar Órdenes y Anotaciones" : "Registrar Órdenes y Anotaciones"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Anotaciones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Anotaciones</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAnotacion}
                className="gap-2 border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589] hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Agregar Anotación
              </Button>
            </div>
            <div className="space-y-3">
              {anotaciones.map((anotacion, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={anotacion}
                    onChange={(e) => updateAnotacion(index, e.target.value)}
                    placeholder={`Anotación ${index + 1}...`}
                    rows={2}
                    className="resize-none flex-1 border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                  {anotaciones.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeAnotacion(index)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Órdenes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Órdenes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOrden}
                className="gap-2 border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589] hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Agregar Orden
              </Button>
            </div>
            <div className="space-y-3">
              {ordenes.map((orden, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={orden}
                    onChange={(e) => updateOrden(index, e.target.value)}
                    placeholder={`Orden ${index + 1}...`}
                    rows={2}
                    className="resize-none flex-1 border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                  {ordenes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeOrden(index)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
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
              {isLoading ? "Guardando..." : existingOrders ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

