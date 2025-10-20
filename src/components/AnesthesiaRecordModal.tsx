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
import { Textarea } from "@/components/ui/textarea";
import { Pill, X, Save } from "lucide-react";
import { CreateAnesthesiaRecordData, AnesthesiaRecord, AnesthesiaGridData } from "@/types/surgery";
import { useToast } from "@/hooks/use-toast";
import AnesthesiaGrid from "./AnesthesiaGrid";

interface AnesthesiaRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgeryId: string;
  existingRecord?: AnesthesiaRecord | null;
  onSave: () => void;
}

export default function AnesthesiaRecordModal({
  isOpen,
  onClose,
  surgeryId,
  existingRecord,
  onSave,
}: AnesthesiaRecordModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAnesthesiaRecordData>({
    premedicacion: "",
    estadoFisico: "",
    pronosticoOperatorio: "",
    agentesTecnicas: "",
    resumenLiquidos: "",
    tiempoDuracionAnestesia: "",
    operacion: "",
    cirujano: "",
    complicaciones: "",
    anestesiologo: "",
    gridData: "",
  });
  const [gridData, setGridData] = useState<AnesthesiaGridData>({});

  useEffect(() => {
    if (isOpen && existingRecord) {
      setFormData({
        premedicacion: existingRecord.premedicacion || "",
        estadoFisico: existingRecord.estadoFisico || "",
        pronosticoOperatorio: existingRecord.pronosticoOperatorio || "",
        agentesTecnicas: existingRecord.agentesTecnicas || "",
        resumenLiquidos: existingRecord.resumenLiquidos || "",
        tiempoDuracionAnestesia: existingRecord.tiempoDuracionAnestesia || "",
        operacion: existingRecord.operacion || "",
        cirujano: existingRecord.cirujano || "",
        complicaciones: existingRecord.complicaciones || "",
        anestesiologo: existingRecord.anestesiologo || "",
        gridData: existingRecord.gridData || "",
      });
      
      // Parse grid data if it exists
      if (existingRecord.gridData) {
        try {
          const parsedGridData = JSON.parse(existingRecord.gridData);
          setGridData(parsedGridData);
        } catch (error) {
          console.error("Error parsing grid data:", error);
          setGridData({});
        }
      } else {
        setGridData({});
      }
    } else if (isOpen) {
      // Reset form when creating new record
      setFormData({
        premedicacion: "",
        estadoFisico: "",
        pronosticoOperatorio: "",
        agentesTecnicas: "",
        resumenLiquidos: "",
        tiempoDuracionAnestesia: "",
        operacion: "",
        cirujano: "",
        complicaciones: "",
        anestesiologo: "",
        gridData: "",
      });
      setGridData({});
    }
  }, [isOpen, existingRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // Convert grid data to JSON string
      const gridDataJson = JSON.stringify(gridData);
      const submitData = {
        ...formData,
        gridData: gridDataJson,
      };

      const method = existingRecord ? "PUT" : "POST";
      const response = await fetch(`/api/surgeries/${surgeryId}/anesthesia-record`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar registro de anestesia");
      }

      toast({
        title: "Éxito",
        description: existingRecord 
          ? "Registro de anestesia actualizado correctamente"
          : "Registro de anestesia creado correctamente",
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
            <Pill className="h-5 w-5 text-[#2E9589]" />
            {existingRecord ? "Editar" : "Registrar"} Registro de Anestesia
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección Pre-Anestesia */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Pre-Anestesia y Pronóstico
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="premedicacion" className="text-sm font-medium text-gray-700">
                  Premedicación
                </Label>
                <Input
                  id="premedicacion"
                  value={formData.premedicacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, premedicacion: e.target.value }))}
                  placeholder="Medicamentos pre-anestésicos..."
                  className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estadoFisico" className="text-sm font-medium text-gray-700">
                  Estado Físico
                </Label>
                <Input
                  id="estadoFisico"
                  value={formData.estadoFisico}
                  onChange={(e) => setFormData(prev => ({ ...prev, estadoFisico: e.target.value }))}
                  placeholder="Estado físico del paciente..."
                  className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pronosticoOperatorio" className="text-sm font-medium text-gray-700">
                  Pronóstico Operatorio
                </Label>
                <Input
                  id="pronosticoOperatorio"
                  value={formData.pronosticoOperatorio}
                  onChange={(e) => setFormData(prev => ({ ...prev, pronosticoOperatorio: e.target.value }))}
                  placeholder="Pronóstico de la operación..."
                  className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sección Agentes y Técnicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Agentes y Técnicas
            </h3>
            <div className="space-y-2">
              <Label htmlFor="agentesTecnicas" className="text-sm font-medium text-gray-700">
                Agentes, Dosis y Técnicas Utilizadas
              </Label>
              <Textarea
                id="agentesTecnicas"
                value={formData.agentesTecnicas}
                onChange={(e) => setFormData(prev => ({ ...prev, agentesTecnicas: e.target.value }))}
                placeholder="Detalle los agentes anestésicos, dosis y técnicas utilizadas (inducción, mantenimiento, despertar)..."
                rows={4}
                className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>
          </div>

          {/* Sección Líquidos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Administración de Líquidos
            </h3>
            <div className="space-y-2">
              <Label htmlFor="resumenLiquidos" className="text-sm font-medium text-gray-700">
                Resumen de Administración de Líquidos
              </Label>
              <Textarea
                id="resumenLiquidos"
                value={formData.resumenLiquidos}
                onChange={(e) => setFormData(prev => ({ ...prev, resumenLiquidos: e.target.value }))}
                placeholder="Dextrosa en agua, Ringer Lactado, Solución Salina, Plasma, Sangre, Otros..."
                rows={3}
                className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
              />
            </div>
          </div>

          {/* Sección Operación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Información de la Operación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tiempoDuracionAnestesia" className="text-sm font-medium text-gray-700">
                  Tiempo que Duró la Anestesia
                </Label>
                <Input
                  id="tiempoDuracionAnestesia"
                  value={formData.tiempoDuracionAnestesia}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiempoDuracionAnestesia: e.target.value }))}
                  placeholder="Ej: 2 horas 30 minutos"
                  className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="operacion" className="text-sm font-medium text-gray-700">
                  Operación
                </Label>
                <Input
                  id="operacion"
                  value={formData.operacion}
                  onChange={(e) => setFormData(prev => ({ ...prev, operacion: e.target.value }))}
                  placeholder="Tipo de operación realizada..."
                  className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cirujano" className="text-sm font-medium text-gray-700">
                  Cirujano
                </Label>
                <Input
                  id="cirujano"
                  value={formData.cirujano}
                  onChange={(e) => setFormData(prev => ({ ...prev, cirujano: e.target.value }))}
                  placeholder="Nombre del cirujano..."
                  className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sección Complicaciones y Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Complicaciones y Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complicaciones" className="text-sm font-medium text-gray-700">
                  Complicaciones
                </Label>
                <Textarea
                  id="complicaciones"
                  value={formData.complicaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, complicaciones: e.target.value }))}
                  placeholder="Laringoespasmo, Exceso de Moco, Depresión Respiratoria, Necesidad de Oxígeno, Bucking, Vómito, Hemorragia, Arritmia, Bradicardia, Taquicardia, Choque..."
                  rows={3}
                  className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anestesiologo" className="text-sm font-medium text-gray-700">
                  Anestesiólogo
                </Label>
                <Input
                  id="anestesiologo"
                  value={formData.anestesiologo}
                  onChange={(e) => setFormData(prev => ({ ...prev, anestesiologo: e.target.value }))}
                  placeholder="Nombre del anestesiólogo..."
                  className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sección Gráfico de Monitoreo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Gráfico de Monitoreo de Anestesia
            </h3>
            <div className="bg-white border border-gray-300 rounded-lg p-4">
              <AnesthesiaGrid 
                data={gridData} 
                onChange={setGridData}
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
              {isLoading ? "Guardando..." : existingRecord ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
