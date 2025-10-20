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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, X, Save } from "lucide-react";
import { CreateOperatingRoomRequestData, OperatingRoomRequest } from "@/types/surgery";
import { useToast } from "@/hooks/use-toast";

interface OperatingRoomRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgeryId: string;
  existingRequest?: OperatingRoomRequest | null;
  onSave: () => void;
}

export default function OperatingRoomRequestModal({
  isOpen,
  onClose,
  surgeryId,
  existingRequest,
  onSave,
}: OperatingRoomRequestModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOperatingRoomRequestData>({
    diagnosticoPreoperatorio: "",
    tipoAnestesia: "",
    instrumentoEspecial: "",
    horaSolicitud: "",
    horaLlegadaQx: "",
    horaEntraQx: "",
    horaAnestesia: "",
    horaInicioQx: "",
    horaFinQx: "",
    horaSaleQx: "",
    horaRecibeRecuperacion: "",
    horaSaleRecuperacion: "",
    usoSangre: false,
    entregaOportunaSangre: false,
    complicacion: false,
    tipoComplicacion: "",
    contaminacionQuirofano: false,
    fumigaQuirofanoPor: "",
    tiempo: "",
    medicoSolicitante: "",
    anestesiologoAnestesista: "",
    instrumentista: "",
    circulante: "",
    ayudantes: "",
    observaciones: "",
  });

  useEffect(() => {
    if (isOpen && existingRequest) {
      setFormData({
        diagnosticoPreoperatorio: existingRequest.diagnosticoPreoperatorio || "",
        tipoAnestesia: existingRequest.tipoAnestesia || "",
        instrumentoEspecial: existingRequest.instrumentoEspecial || "",
        horaSolicitud: existingRequest.horaSolicitud ? new Date(existingRequest.horaSolicitud).toISOString().slice(0, 16) : "",
        horaLlegadaQx: existingRequest.horaLlegadaQx ? new Date(existingRequest.horaLlegadaQx).toISOString().slice(0, 16) : "",
        horaEntraQx: existingRequest.horaEntraQx ? new Date(existingRequest.horaEntraQx).toISOString().slice(0, 16) : "",
        horaAnestesia: existingRequest.horaAnestesia ? new Date(existingRequest.horaAnestesia).toISOString().slice(0, 16) : "",
        horaInicioQx: existingRequest.horaInicioQx ? new Date(existingRequest.horaInicioQx).toISOString().slice(0, 16) : "",
        horaFinQx: existingRequest.horaFinQx ? new Date(existingRequest.horaFinQx).toISOString().slice(0, 16) : "",
        horaSaleQx: existingRequest.horaSaleQx ? new Date(existingRequest.horaSaleQx).toISOString().slice(0, 16) : "",
        horaRecibeRecuperacion: existingRequest.horaRecibeRecuperacion ? new Date(existingRequest.horaRecibeRecuperacion).toISOString().slice(0, 16) : "",
        horaSaleRecuperacion: existingRequest.horaSaleRecuperacion ? new Date(existingRequest.horaSaleRecuperacion).toISOString().slice(0, 16) : "",
        usoSangre: existingRequest.usoSangre,
        entregaOportunaSangre: existingRequest.entregaOportunaSangre,
        complicacion: existingRequest.complicacion,
        tipoComplicacion: existingRequest.tipoComplicacion || "",
        contaminacionQuirofano: existingRequest.contaminacionQuirofano,
        fumigaQuirofanoPor: existingRequest.fumigaQuirofanoPor || "",
        tiempo: existingRequest.tiempo || "",
        medicoSolicitante: existingRequest.medicoSolicitante || "",
        anestesiologoAnestesista: existingRequest.anestesiologoAnestesista || "",
        instrumentista: existingRequest.instrumentista || "",
        circulante: existingRequest.circulante || "",
        ayudantes: existingRequest.ayudantes || "",
        observaciones: existingRequest.observaciones || "",
      });
    }
  }, [isOpen, existingRequest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.diagnosticoPreoperatorio.trim()) {
      toast({
        title: "Campo requerido",
        description: "El diagnóstico preoperatorio es requerido",
        variant: "error",
      });
      return;
    }

    try {
      setIsLoading(true);

      const method = existingRequest ? "PUT" : "POST";
      const response = await fetch(`/api/surgeries/${surgeryId}/operating-room-request`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar solicitud");
      }

      toast({
        title: "Éxito",
        description: existingRequest
          ? "Solicitud de quirófano actualizada correctamente"
          : "Solicitud de quirófano creada correctamente",
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#2E9589]" />
            {existingRequest ? "Editar Solicitud de Quirófano" : "Registrar Solicitud de Quirófano"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="tiempos">Tiempos</TabsTrigger>
              <TabsTrigger value="detalles">Detalles</TabsTrigger>
              <TabsTrigger value="personal">Personal</TabsTrigger>
            </TabsList>

            {/* TAB: General */}
            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosticoPreoperatorio" className="text-sm font-medium text-gray-700">
                  Diagnóstico Preoperatorio <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="diagnosticoPreoperatorio"
                  value={formData.diagnosticoPreoperatorio}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnosticoPreoperatorio: e.target.value }))}
                  placeholder="Diagnóstico preoperatorio..."
                  rows={3}
                  className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoAnestesia" className="text-sm font-medium text-gray-700">Tipo de Anestesia</Label>
                  <Input
                    id="tipoAnestesia"
                    value={formData.tipoAnestesia}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipoAnestesia: e.target.value }))}
                    placeholder="General, regional, local..."
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instrumentoEspecial" className="text-sm font-medium text-gray-700">Instrumento Especial</Label>
                  <Input
                    id="instrumentoEspecial"
                    value={formData.instrumentoEspecial}
                    onChange={(e) => setFormData(prev => ({ ...prev, instrumentoEspecial: e.target.value }))}
                    placeholder="Instrumentos especiales requeridos..."
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB: Tiempos */}
            <TabsContent value="tiempos" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horaSolicitud" className="text-sm font-medium text-gray-700">Hora Solicitud Pte. a CX</Label>
                  <Input
                    id="horaSolicitud"
                    type="datetime-local"
                    value={formData.horaSolicitud}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaSolicitud: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaLlegadaQx" className="text-sm font-medium text-gray-700">Hora que llega Pte. QX</Label>
                  <Input
                    id="horaLlegadaQx"
                    type="datetime-local"
                    value={formData.horaLlegadaQx}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaLlegadaQx: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaEntraQx" className="text-sm font-medium text-gray-700">Hora que entra a QX</Label>
                  <Input
                    id="horaEntraQx"
                    type="datetime-local"
                    value={formData.horaEntraQx}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaEntraQx: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaAnestesia" className="text-sm font-medium text-gray-700">Hora de Anestesia</Label>
                  <Input
                    id="horaAnestesia"
                    type="datetime-local"
                    value={formData.horaAnestesia}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaAnestesia: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaInicioQx" className="text-sm font-medium text-gray-700">Hora Inicio Cirugía</Label>
                  <Input
                    id="horaInicioQx"
                    type="datetime-local"
                    value={formData.horaInicioQx}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaInicioQx: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaFinQx" className="text-sm font-medium text-gray-700">Hora Finaliza Cirugía</Label>
                  <Input
                    id="horaFinQx"
                    type="datetime-local"
                    value={formData.horaFinQx}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaFinQx: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaSaleQx" className="text-sm font-medium text-gray-700">Hora Sale de Cirugía</Label>
                  <Input
                    id="horaSaleQx"
                    type="datetime-local"
                    value={formData.horaSaleQx}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaSaleQx: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaRecibeRecuperacion" className="text-sm font-medium text-gray-700">Hora Recibe en Recuperación</Label>
                  <Input
                    id="horaRecibeRecuperacion"
                    type="datetime-local"
                    value={formData.horaRecibeRecuperacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaRecibeRecuperacion: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horaSaleRecuperacion" className="text-sm font-medium text-gray-700">Hora Sale de Recuperación</Label>
                  <Input
                    id="horaSaleRecuperacion"
                    type="datetime-local"
                    value={formData.horaSaleRecuperacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, horaSaleRecuperacion: e.target.value }))}
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>
              </div>
            </TabsContent>

            {/* TAB: Detalles */}
            <TabsContent value="detalles" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="usoSangre"
                    checked={formData.usoSangre}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, usoSangre: !!checked }))}
                  />
                  <Label htmlFor="usoSangre" className="text-sm font-medium text-gray-700">Uso de Sangre</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="entregaOportunaSangre"
                    checked={formData.entregaOportunaSangre}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, entregaOportunaSangre: !!checked }))}
                  />
                  <Label htmlFor="entregaOportunaSangre" className="text-sm font-medium text-gray-700">Entrega Oportuna de Sangre</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="complicacion"
                    checked={formData.complicacion}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, complicacion: !!checked }))}
                  />
                  <Label htmlFor="complicacion" className="text-sm font-medium text-gray-700">Complicación en la Cirugía</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="contaminacionQuirofano"
                    checked={formData.contaminacionQuirofano}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, contaminacionQuirofano: !!checked }))}
                  />
                  <Label htmlFor="contaminacionQuirofano" className="text-sm font-medium text-gray-700">Contaminación de Quirófano</Label>
                </div>
              </div>

              {formData.complicacion && (
                <div className="space-y-2">
                  <Label htmlFor="tipoComplicacion" className="text-sm font-medium text-gray-700">Tipo de Complicación</Label>
                  <Textarea
                    id="tipoComplicacion"
                    value={formData.tipoComplicacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipoComplicacion: e.target.value }))}
                    placeholder="Describa la complicación..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>
              )}

              {formData.contaminacionQuirofano && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fumigaQuirofanoPor" className="text-sm font-medium text-gray-700">Se Fumiga Quirófano Por</Label>
                    <Input
                      id="fumigaQuirofanoPor"
                      value={formData.fumigaQuirofanoPor}
                      onChange={(e) => setFormData(prev => ({ ...prev, fumigaQuirofanoPor: e.target.value }))}
                      placeholder="Motivo de fumigación..."
                      className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiempo" className="text-sm font-medium text-gray-700">Tiempo</Label>
                    <Input
                      id="tiempo"
                      value={formData.tiempo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tiempo: e.target.value }))}
                      placeholder="Tiempo de fumigación..."
                      className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB: Personal */}
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="medicoSolicitante" className="text-sm font-medium text-gray-700">Médico Solicitante</Label>
                  <Input
                    id="medicoSolicitante"
                    value={formData.medicoSolicitante}
                    onChange={(e) => setFormData(prev => ({ ...prev, medicoSolicitante: e.target.value }))}
                    placeholder="Nombre del médico..."
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anestesiologoAnestesista" className="text-sm font-medium text-gray-700">Anestesiólogo/Anestesista</Label>
                  <Input
                    id="anestesiologoAnestesista"
                    value={formData.anestesiologoAnestesista}
                    onChange={(e) => setFormData(prev => ({ ...prev, anestesiologoAnestesista: e.target.value }))}
                    placeholder="Nombre del anestesiólogo..."
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instrumentista" className="text-sm font-medium text-gray-700">Instrumentista</Label>
                  <Input
                    id="instrumentista"
                    value={formData.instrumentista}
                    onChange={(e) => setFormData(prev => ({ ...prev, instrumentista: e.target.value }))}
                    placeholder="Nombre del instrumentista..."
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="circulante" className="text-sm font-medium text-gray-700">Circulante</Label>
                  <Input
                    id="circulante"
                    value={formData.circulante}
                    onChange={(e) => setFormData(prev => ({ ...prev, circulante: e.target.value }))}
                    placeholder="Nombre del circulante..."
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="ayudantes" className="text-sm font-medium text-gray-700">Ayudantes</Label>
                  <Textarea
                    id="ayudantes"
                    value={formData.ayudantes}
                    onChange={(e) => setFormData(prev => ({ ...prev, ayudantes: e.target.value }))}
                    placeholder="Lista de ayudantes..."
                    rows={2}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observaciones" className="text-sm font-medium text-gray-700">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                    placeholder="Observaciones adicionales..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
              {isLoading ? "Guardando..." : existingRequest ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

