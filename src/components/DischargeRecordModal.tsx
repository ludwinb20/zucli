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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Calendar, Clock, DollarSign } from "lucide-react";
import { CreateDischargeRecordData, CondicionSalida, DischargeRecord } from "@/types/hospitalization";
import { SpecialtyDatePicker } from "@/components/SpecialtyDatePicker";
import { useToast } from "@/hooks/use-toast";

interface Specialty {
  id: string;
  name: string;
  isActive: boolean;
}

interface DischargeRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId?: string;
  onSave: (id: string, data: CreateDischargeRecordData) => Promise<void>;
  isLoading?: boolean;
  existingRecord?: DischargeRecord | null;
  admissionDate?: string | Date;
  dailyRate?: number;
}

export default function DischargeRecordModal({
  isOpen,
  onClose,
  hospitalizationId,
  onSave,
  isLoading = false,
  existingRecord,
  admissionDate,
  dailyRate = 0,
}: DischargeRecordModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    // Información de Epicrisis
    diagnosticoIngreso: "",
    diagnosticoEgreso: "",
    resumenClinico: "",
    tratamiento: "",
    condicionSalida: "" as CondicionSalida | "",
    recomendaciones: "",
    // Cita de Consulta Externa
    citaConsultaExterna: false,
    citaFecha: "",
    citaHora: "",
    citaEspecialidadId: "",
  });

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [selectedDateObj, setSelectedDateObj] = useState<Date | undefined>(undefined);

  // Cargar días disponibles cuando se selecciona especialidad
  useEffect(() => {
    const loadAvailableDays = async () => {
      if (formData.citaEspecialidadId) {
        try {
          const response = await fetch(`/api/specialties/${formData.citaEspecialidadId}/days`);
          if (response.ok) {
            const data = await response.json();
            const days = data.days?.map((d: { dayOfWeek: number }) => d.dayOfWeek) || [];
            setAvailableDays(days.length > 0 ? days : [0, 1, 2, 3, 4, 5, 6]); // Todos los días si no está configurado
          }
        } catch (error) {
          console.error('Error loading available days:', error);
          setAvailableDays([0, 1, 2, 3, 4, 5, 6]); // Default: todos los días
        }
      } else {
        setAvailableDays([]);
      }
    };
    loadAvailableDays();
  }, [formData.citaEspecialidadId]);

  useEffect(() => {
    if (isOpen) {
      loadSpecialties();
      if (existingRecord) {
        // Cargar datos existentes
        setFormData({
          diagnosticoIngreso: existingRecord.diagnosticoIngreso || "",
          diagnosticoEgreso: existingRecord.diagnosticoEgreso || "",
          resumenClinico: existingRecord.resumenClinico || "",
          tratamiento: existingRecord.tratamiento || "",
          condicionSalida: existingRecord.condicionSalida || "",
          recomendaciones: existingRecord.recomendaciones || "",
          citaConsultaExterna: existingRecord.citaConsultaExterna,
          citaFecha: existingRecord.cita?.appointmentDate ? new Date(existingRecord.cita.appointmentDate).toISOString().split('T')[0] : "",
          citaHora: existingRecord.cita?.appointmentDate ? new Date(existingRecord.cita.appointmentDate).toTimeString().slice(0, 5) : "",
          citaEspecialidadId: existingRecord.cita?.specialty?.id || "",
        });
        setSelectedDateObj(existingRecord.cita?.appointmentDate ? new Date(existingRecord.cita.appointmentDate) : undefined);
      } else {
        // Resetear formulario
        setFormData({
          diagnosticoIngreso: "",
          diagnosticoEgreso: "",
          resumenClinico: "",
          tratamiento: "",
          condicionSalida: "",
          recomendaciones: "",
          citaConsultaExterna: false,
          citaFecha: "",
          citaHora: "",
          citaEspecialidadId: "",
        });
        setSelectedDateObj(undefined);
      }
    }
  }, [isOpen, existingRecord]);

  const loadSpecialties = async () => {
    try {
      const response = await fetch("/api/specialties");
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data.specialties?.filter((s: Specialty) => s.isActive) || []);
      }
    } catch (error) {
      console.error("Error loading specialties:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hospitalizationId) return;

    // Validar que al menos un campo tenga contenido
    const hasContent = 
      formData.diagnosticoIngreso.trim() ||
      formData.diagnosticoEgreso.trim() ||
      formData.resumenClinico.trim() ||
      formData.tratamiento.trim() ||
      formData.condicionSalida ||
      formData.recomendaciones.trim();

    if (!hasContent) {
      toast({
        title: "Campos requeridos",
        description: "Al menos un campo debe tener contenido",
        variant: "error",
      });
      return;
    }

    // Validar cita si está marcada
    if (formData.citaConsultaExterna) {
      if (!formData.citaEspecialidadId) {
        toast({
          title: "Especialidad requerida",
          description: "Debe seleccionar una especialidad para la cita",
          variant: "error",
        });
        return;
      }
      if (!formData.citaFecha) {
        toast({
          title: "Fecha requerida",
          description: "Debe seleccionar una fecha para la cita",
          variant: "error",
        });
        return;
      }
      if (!formData.citaHora) {
        toast({
          title: "Hora requerida",
          description: "Debe seleccionar una hora para la cita",
          variant: "error",
        });
        return;
      }
    }

    const data: CreateDischargeRecordData = {
      // Información de Epicrisis
      diagnosticoIngreso: formData.diagnosticoIngreso.trim() || undefined,
      diagnosticoEgreso: formData.diagnosticoEgreso.trim() || undefined,
      resumenClinico: formData.resumenClinico.trim() || undefined,
      tratamiento: formData.tratamiento.trim() || undefined,
      condicionSalida: formData.condicionSalida || undefined,
      recomendaciones: formData.recomendaciones.trim() || undefined,
      // Cita de Consulta Externa
      citaConsultaExterna: formData.citaConsultaExterna,
      citaFecha: formData.citaConsultaExterna ? formData.citaFecha : undefined,
      citaHora: formData.citaConsultaExterna ? formData.citaHora : undefined,
      citaEspecialidadId: formData.citaConsultaExterna ? formData.citaEspecialidadId : undefined,
    };

    await onSave(hospitalizationId, data);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      diagnosticoIngreso: "",
      diagnosticoEgreso: "",
      resumenClinico: "",
      tratamiento: "",
      condicionSalida: "",
      recomendaciones: "",
      citaConsultaExterna: false,
      citaFecha: "",
      citaHora: "",
      citaEspecialidadId: "",
    });
    setSelectedDateObj(undefined);
    setAvailableDays([]);
    onClose();
  };

  // Calcular días y costo estimado
  const calculateDaysAndCost = () => {
    if (!admissionDate || !dailyRate) return { days: 0, cost: 0 };
    
    const admission = new Date(admissionDate);
    const discharge = new Date();
    const timeDiff = discharge.getTime() - admission.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const actualDays = Math.max(1, days);
    const cost = actualDays * dailyRate;
    
    return { days: actualDays, cost };
  };

  const { days, cost } = calculateDaysAndCost();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-[#2E9589]" />
            {existingRecord ? "Editar Epicrisis" : "Epicrisis"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de Epicrisis */}
          <div className="space-y-4">            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosticoIngreso" className="text-sm font-medium text-gray-700">Diagnóstico de Ingreso</Label>
                <Textarea
                  id="diagnosticoIngreso"
                  value={formData.diagnosticoIngreso}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosticoIngreso: e.target.value }))}
                  placeholder="Diagnóstico al momento del ingreso..."
                  rows={3}
                  className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosticoEgreso" className="text-sm font-medium text-gray-700">Diagnóstico de Egreso</Label>
                <Textarea
                  id="diagnosticoEgreso"
                  value={formData.diagnosticoEgreso}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosticoEgreso: e.target.value }))}
                  placeholder="Diagnóstico al momento del egreso..."
                  rows={3}
                  className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="resumenClinico" className="text-sm font-medium text-gray-700">Resumen Clínico</Label>
                <Textarea
                  id="resumenClinico"
                  value={formData.resumenClinico}
                  onChange={(e) => setFormData(prev => ({ ...prev, resumenClinico: e.target.value }))}
                  placeholder="Resumen del curso clínico durante la hospitalización..."
                  rows={4}
                  className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tratamiento" className="text-sm font-medium text-gray-700">Tratamiento</Label>
                <Textarea
                  id="tratamiento"
                  value={formData.tratamiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, tratamiento: e.target.value }))}
                  placeholder="Tratamientos aplicados durante la hospitalización..."
                  rows={4}
                  className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condicionSalida" className="text-sm font-medium text-gray-700">Condición de Salida</Label>
                <Select
                  value={formData.condicionSalida}
                  onValueChange={(value: CondicionSalida) => setFormData(prev => ({ ...prev, condicionSalida: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar condición..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mejorado">Mejorado</SelectItem>
                    <SelectItem value="Igual">Igual</SelectItem>
                    <SelectItem value="Curado">Curado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recomendaciones" className="text-sm font-medium text-gray-700">Recomendaciones</Label>
                <Textarea
                  id="recomendaciones"
                  value={formData.recomendaciones}
                  onChange={(e) => setFormData(prev => ({ ...prev, recomendaciones: e.target.value }))}
                  placeholder="Recomendaciones para el paciente..."
                  rows={3}
                  className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Cita de Consulta Externa */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="citaConsultaExterna"
                checked={formData.citaConsultaExterna}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, citaConsultaExterna: !!checked }))}
              />
              <Label htmlFor="citaConsultaExterna" className="text-sm font-medium text-gray-700">
                Agendar Cita de Consulta Externa
              </Label>
            </div>

            {formData.citaConsultaExterna && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                {/* 1) Especialidad */}
                <div className="space-y-2">
                  <Label htmlFor="citaEspecialidadId" className="text-sm font-medium text-gray-700">Especialidad</Label>
                  <Select
                    value={formData.citaEspecialidadId}
                    onValueChange={(value) => {
                      // Al cambiar la especialidad, limpiar la fecha seleccionada
                      setFormData(prev => ({ ...prev, citaEspecialidadId: value, citaFecha: "" }));
                      setSelectedDateObj(undefined);
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent">
                      <SelectValue placeholder="Seleccionar especialidad..." />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2) Fecha - depende de especialidad */}
                <div className="space-y-2">
                  <Label htmlFor="citaFecha" className="text-sm font-medium text-gray-700">Fecha de la Cita</Label>
                  <SpecialtyDatePicker
                    selectedDate={selectedDateObj}
                    onDateSelect={(date) => {
                      setSelectedDateObj(date);
                      setFormData(prev => ({ 
                        ...prev, 
                        citaFecha: date ? date.toISOString().split('T')[0] : "" 
                      }));
                    }}
                    availableDays={availableDays}
                    disabled={!formData.citaEspecialidadId}
                    minDate={new Date()}
                  />
                </div>

                {/* 3) Hora */}
                <div className="space-y-2">
                  <Label htmlFor="citaHora" className="text-sm font-medium text-gray-700">Hora de la Cita</Label>
                  <Input
                    id="citaHora"
                    type="time"
                    value={formData.citaHora}
                    onChange={(e) => setFormData(prev => ({ ...prev, citaHora: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>
              </div>
            )}
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
              disabled={isLoading}
              className="gap-2 bg-[#2E9589] text-white hover:bg-[#2E9589]/90"
            >
              <LogOut className="h-4 w-4" />
              {isLoading ? "Procesando..." : existingRecord ? "Actualizar Epicrisis" : "Guardar Epicrisis"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
