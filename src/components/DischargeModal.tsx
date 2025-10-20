"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { InlineSpinner } from "@/components/ui/spinner";
import { DischargeModalProps } from "@/types/hospitalization";
import { calculateHospitalizationCost, getDailyRate } from "@/lib/hospitalization-helpers";
import { LogOut, DollarSign, Calendar, AlertCircle, X } from "lucide-react";

export default function DischargeModal({
  isOpen,
  onClose,
  hospitalization,
  onDischarge,
}: DischargeModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [dischargeDate, setDischargeDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dischargeNotes, setDischargeNotes] = useState("");

  if (!hospitalization) {
    return null;
  }

  const dailyRate = getDailyRate(hospitalization.dailyRateItem, hospitalization.dailyRateVariant);
  
  if (dailyRate === 0) {
    return null; // No se puede dar de alta sin item configurado
  }

  const costCalc = calculateHospitalizationCost(
    hospitalization.admissionDate,
    dailyRate,
    new Date(dischargeDate)
  );

  const handleDischarge = async () => {
    if (!dischargeDate) {
      toast({
        title: "Error",
        description: "La fecha de alta es requerida",
        variant: "error",
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/hospitalizations/${hospitalization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "alta",
          dischargeDate,
          dischargeNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al dar de alta");
      }

      toast({
        title: "Éxito",
        description: "Paciente dado de alta exitosamente",
      });

      await onDischarge(dischargeDate, dischargeNotes);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al dar de alta",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <LogOut className="h-5 w-5 text-[#2E9589]" />
            Dar de Alta
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            {hospitalization.patient.firstName} {hospitalization.patient.lastName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Resumen */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Confirmación de Alta</p>
                  <p>
                    Al dar de alta, se generará un pago automático por el total de la estancia.
                    La habitación quedará disponible para nuevos pacientes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información de la Estancia */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Fecha de Ingreso</p>
                  <p className="font-medium">
                    {new Date(hospitalization.admissionDate).toLocaleDateString("es-HN")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Habitación</p>
                  <p className="font-medium">
                    {hospitalization.room ? `Habitación ${hospitalization.room.number}` : "Sin asignar"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fecha de Alta */}
          <div className="space-y-2">
            <Label htmlFor="dischargeDate" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha de Alta *
            </Label>
            <Input
              id="dischargeDate"
              type="date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              min={new Date(hospitalization.admissionDate).toISOString().split("T")[0]}
            />
          </div>

          {/* Cálculo de Costo */}
          <Card className="border-[#2E9589] bg-green-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#2E9589]" />
                Cálculo del Costo Total
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Servicio:</span>
                  <div className="text-right">
                    <span className="font-medium">{hospitalization.dailyRateItem!.name}</span>
                    {hospitalization.dailyRateVariant && (
                      <span className="text-xs text-gray-500 block">
                        {hospitalization.dailyRateVariant.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tarifa Diaria:</span>
                  <span className="font-medium">L{costCalc.dailyRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Días de Estancia:</span>
                  <span className="font-medium">
                    {costCalc.daysOfStay} día{costCalc.daysOfStay !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="pt-3 border-t border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">TOTAL A PAGAR:</span>
                    <span className="text-2xl font-bold text-[#2E9589]">
                      L{costCalc.totalCost.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-right mt-1">
                    ({costCalc.daysOfStay} × L{costCalc.dailyRate.toFixed(2)})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas de Alta */}
          <div className="space-y-2">
            <Label htmlFor="dischargeNotes" className="text-sm font-medium text-gray-700">
              Notas de Alta (Opcional)
            </Label>
            <Textarea
              id="dischargeNotes"
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              placeholder="Observaciones, recomendaciones, tratamiento a seguir..."
              rows={4}
              className="resize-none"
            />
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
            onClick={handleDischarge}
            disabled={saving}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            {saving ? (
              <InlineSpinner className="mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            Confirmar Alta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

