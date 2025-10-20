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
import { Plus, X, FileText } from "lucide-react";
import { CreateAdmissionRecordData, AdmissionRecord } from "@/types/hospitalization";

interface AdmissionRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalizationId?: string;
  onSave: (id: string, data: CreateAdmissionRecordData) => Promise<void>;
  isLoading?: boolean;
  existingRecord?: AdmissionRecord | null;
}

export default function AdmissionRecordModal({
  isOpen,
  onClose,
  hospitalizationId,
  onSave,
  isLoading = false,
  existingRecord,
}: AdmissionRecordModalProps) {
  const [formData, setFormData] = useState({
    // Historia Clínica
    hea: "",
    fog: "",
    antecedentesPatologicos: "",
    antecedentesInmunoAlergicos: "",
    antecedentesGO: "",
    antecedentesTraumaticosQuirurgicos: "",
    antecedentesFamiliares: "",
    // Órdenes y Anotaciones Médicas
    dieta: "",
    signosVitalesHoras: "",
    semifowler: false,
    fowler: false,
    liquidosIV: "",
    medicamentos: "",
    examenesLaboratorio: "",
    glocometria: "",
    // Anotaciones y Órdenes
    anotaciones: [""],
    ordenes: [""],
  });

  useEffect(() => {
    if (isOpen) {
      if (existingRecord) {
        // Cargar datos existentes
        setFormData({
          hea: existingRecord.hea || "",
          fog: existingRecord.fog || "",
          antecedentesPatologicos: existingRecord.antecedentesPatologicos || "",
          antecedentesInmunoAlergicos: existingRecord.antecedentesInmunoAlergicos || "",
          antecedentesGO: existingRecord.antecedentesGO || "",
          antecedentesTraumaticosQuirurgicos: existingRecord.antecedentesTraumaticosQuirurgicos || "",
          antecedentesFamiliares: existingRecord.antecedentesFamiliares || "",
          dieta: existingRecord.dieta || "",
          signosVitalesHoras: existingRecord.signosVitalesHoras?.toString() || "",
          semifowler: existingRecord.semifowler,
          fowler: existingRecord.fowler,
          liquidosIV: existingRecord.liquidosIV || "",
          medicamentos: existingRecord.medicamentos || "",
          examenesLaboratorio: existingRecord.examenesLaboratorio || "",
          glocometria: existingRecord.glocometria || "",
          anotaciones: existingRecord.anotaciones?.map(a => a.content) || [""],
          ordenes: existingRecord.ordenes?.map(o => o.content) || [""],
        });
      } else {
        // Resetear formulario
        setFormData({
          hea: "",
          fog: "",
          antecedentesPatologicos: "",
          antecedentesInmunoAlergicos: "",
          antecedentesGO: "",
          antecedentesTraumaticosQuirurgicos: "",
          antecedentesFamiliares: "",
          dieta: "",
          signosVitalesHoras: "",
          semifowler: false,
          fowler: false,
          liquidosIV: "",
          medicamentos: "",
          examenesLaboratorio: "",
          glocometria: "",
          anotaciones: [""],
          ordenes: [""],
        });
      }
    }
  }, [isOpen, existingRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hospitalizationId) return;

    // Validar que al menos un campo tenga contenido
    const hasContent = 
      formData.hea.trim() ||
      formData.fog.trim() ||
      formData.antecedentesPatologicos.trim() ||
      formData.antecedentesInmunoAlergicos.trim() ||
      formData.antecedentesGO.trim() ||
      formData.antecedentesTraumaticosQuirurgicos.trim() ||
      formData.antecedentesFamiliares.trim() ||
      formData.dieta.trim() ||
      formData.signosVitalesHoras ||
      formData.semifowler ||
      formData.fowler ||
      formData.liquidosIV.trim() ||
      formData.medicamentos.trim() ||
      formData.examenesLaboratorio.trim() ||
      formData.glocometria.trim() ||
      formData.anotaciones.some(a => a.trim()) ||
      formData.ordenes.some(o => o.trim());

    if (!hasContent) {
      alert("Al menos un campo debe tener contenido");
      return;
    }

    const data: CreateAdmissionRecordData = {
      // Historia Clínica
      hea: formData.hea.trim() || undefined,
      fog: formData.fog.trim() || undefined,
      antecedentesPatologicos: formData.antecedentesPatologicos.trim() || undefined,
      antecedentesInmunoAlergicos: formData.antecedentesInmunoAlergicos.trim() || undefined,
      antecedentesGO: formData.antecedentesGO.trim() || undefined,
      antecedentesTraumaticosQuirurgicos: formData.antecedentesTraumaticosQuirurgicos.trim() || undefined,
      antecedentesFamiliares: formData.antecedentesFamiliares.trim() || undefined,
      // Órdenes y Anotaciones Médicas
      dieta: formData.dieta.trim() || undefined,
      signosVitalesHoras: formData.signosVitalesHoras ? parseInt(formData.signosVitalesHoras) : undefined,
      semifowler: formData.semifowler,
      fowler: formData.fowler,
      liquidosIV: formData.liquidosIV.trim() || undefined,
      medicamentos: formData.medicamentos.trim() || undefined,
      examenesLaboratorio: formData.examenesLaboratorio.trim() || undefined,
      glocometria: formData.glocometria.trim() || undefined,
      // Anotaciones y Órdenes
      anotaciones: formData.anotaciones.filter(a => a.trim()),
      ordenes: formData.ordenes.filter(o => o.trim()),
    };

    await onSave(hospitalizationId, data);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      hea: "",
      fog: "",
      antecedentesPatologicos: "",
      antecedentesInmunoAlergicos: "",
      antecedentesGO: "",
      antecedentesTraumaticosQuirurgicos: "",
      antecedentesFamiliares: "",
      dieta: "",
      signosVitalesHoras: "",
      semifowler: false,
      fowler: false,
      liquidosIV: "",
      medicamentos: "",
      examenesLaboratorio: "",
      glocometria: "",
      anotaciones: [""],
      ordenes: [""],
    });
    onClose();
  };

  const addAnotacion = () => {
    setFormData(prev => ({
      ...prev,
      anotaciones: [...prev.anotaciones, ""]
    }));
  };

  const removeAnotacion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      anotaciones: prev.anotaciones.filter((_, i) => i !== index)
    }));
  };

  const updateAnotacion = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      anotaciones: prev.anotaciones.map((a, i) => i === index ? value : a)
    }));
  };

  const addOrden = () => {
    setFormData(prev => ({
      ...prev,
      ordenes: [...prev.ordenes, ""]
    }));
  };

  const removeOrden = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ordenes: prev.ordenes.filter((_, i) => i !== index)
    }));
  };

  const updateOrden = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ordenes: prev.ordenes.map((o, i) => i === index ? value : o)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2E9589]" />
            {existingRecord ? "Editar Registro de Admisión" : "Registro de Admisión"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="historia" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="historia">Historia Clínica</TabsTrigger>
              <TabsTrigger value="ordenes">Órdenes y Anotaciones</TabsTrigger>
              <TabsTrigger value="anotaciones">Anotaciones</TabsTrigger>
            </TabsList>

            {/* Sección 1: Historia Clínica */}
            <TabsContent value="historia" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hea" className="text-sm font-medium text-gray-700">H.E.A</Label>
                  <Textarea
                    id="hea"
                    value={formData.hea}
                    onChange={(e) => setFormData(prev => ({ ...prev, hea: e.target.value }))}
                    placeholder="Historia de la enfermedad actual..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fog" className="text-sm font-medium text-gray-700">F.O.G.</Label>
                  <Textarea
                    id="fog"
                    value={formData.fog}
                    onChange={(e) => setFormData(prev => ({ ...prev, fog: e.target.value }))}
                    placeholder="Funciones orgánicas generales..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="antecedentesPatologicos" className="text-sm font-medium text-gray-700">Antecedentes Patológicos</Label>
                  <Textarea
                    id="antecedentesPatologicos"
                    value={formData.antecedentesPatologicos}
                    onChange={(e) => setFormData(prev => ({ ...prev, antecedentesPatologicos: e.target.value }))}
                    placeholder="Enfermedades previas..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="antecedentesInmunoAlergicos" className="text-sm font-medium text-gray-700">Antecedentes Inmuno-Alérgicos</Label>
                  <Textarea
                    id="antecedentesInmunoAlergicos"
                    value={formData.antecedentesInmunoAlergicos}
                    onChange={(e) => setFormData(prev => ({ ...prev, antecedentesInmunoAlergicos: e.target.value }))}
                    placeholder="Alergias, reacciones..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="antecedentesGO" className="text-sm font-medium text-gray-700">Antecedentes G.O.</Label>
                  <Textarea
                    id="antecedentesGO"
                    value={formData.antecedentesGO}
                    onChange={(e) => setFormData(prev => ({ ...prev, antecedentesGO: e.target.value }))}
                    placeholder="Gineco-obstétricos..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="antecedentesTraumaticosQuirurgicos" className="text-sm font-medium text-gray-700">Antecedentes Traumáticos y Quirúrgicos</Label>
                  <Textarea
                    id="antecedentesTraumaticosQuirurgicos"
                    value={formData.antecedentesTraumaticosQuirurgicos}
                    onChange={(e) => setFormData(prev => ({ ...prev, antecedentesTraumaticosQuirurgicos: e.target.value }))}
                    placeholder="Cirugías, traumatismos..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="antecedentesFamiliares" className="text-sm font-medium text-gray-700">Antecedentes Familiares</Label>
                  <Textarea
                    id="antecedentesFamiliares"
                    value={formData.antecedentesFamiliares}
                    onChange={(e) => setFormData(prev => ({ ...prev, antecedentesFamiliares: e.target.value }))}
                    placeholder="Historia familiar de enfermedades..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Sección 2: Órdenes y Anotaciones Médicas */}
            <TabsContent value="ordenes" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dieta" className="text-sm font-medium text-gray-700">Dieta</Label>
                  <Textarea
                    id="dieta"
                    value={formData.dieta}
                    onChange={(e) => setFormData(prev => ({ ...prev, dieta: e.target.value }))}
                    placeholder="Indicaciones dietéticas..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signosVitalesHoras" className="text-sm font-medium text-gray-700">Signos Vitales cada (horas)</Label>
                  <Input
                    id="signosVitalesHoras"
                    type="number"
                    min="1"
                    value={formData.signosVitalesHoras}
                    onChange={(e) => setFormData(prev => ({ ...prev, signosVitalesHoras: e.target.value }))}
                    placeholder="Ej: 4, 6, 8"
                    className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Posiciones</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="semifowler"
                        checked={formData.semifowler}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, semifowler: !!checked }))}
                      />
                      <Label htmlFor="semifowler" className="text-sm font-medium text-gray-700">Semifowler</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fowler"
                        checked={formData.fowler}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, fowler: !!checked }))}
                      />
                      <Label htmlFor="fowler" className="text-sm font-medium text-gray-700">Fowler</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="liquidosIV" className="text-sm font-medium text-gray-700">Líquidos IV</Label>
                  <Textarea
                    id="liquidosIV"
                    value={formData.liquidosIV}
                    onChange={(e) => setFormData(prev => ({ ...prev, liquidosIV: e.target.value }))}
                    placeholder="Indicaciones de líquidos intravenosos..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicamentos" className="text-sm font-medium text-gray-700">Medicamentos</Label>
                  <Textarea
                    id="medicamentos"
                    value={formData.medicamentos}
                    onChange={(e) => setFormData(prev => ({ ...prev, medicamentos: e.target.value }))}
                    placeholder="Medicamentos prescritos..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examenesLaboratorio" className="text-sm font-medium text-gray-700">Exámenes de Laboratorio</Label>
                  <Textarea
                    id="examenesLaboratorio"
                    value={formData.examenesLaboratorio}
                    onChange={(e) => setFormData(prev => ({ ...prev, examenesLaboratorio: e.target.value }))}
                    placeholder="Exámenes solicitados..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="glocometria" className="text-sm font-medium text-gray-700">Glocometría</Label>
                  <Textarea
                    id="glocometria"
                    value={formData.glocometria}
                    onChange={(e) => setFormData(prev => ({ ...prev, glocometria: e.target.value }))}
                    placeholder="Control de glucosa..."
                    rows={3}
                    className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Sección 3: Anotaciones */}
            <TabsContent value="anotaciones" className="space-y-6">
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
                  {formData.anotaciones.map((anotacion, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        value={anotacion}
                        onChange={(e) => updateAnotacion(index, e.target.value)}
                        placeholder="Escriba la anotación..."
                        rows={2}
                        className="resize-none flex-1 border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                      />
                      {formData.anotaciones.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAnotacion(index)}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
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
                  {formData.ordenes.map((orden, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        value={orden}
                        onChange={(e) => updateOrden(index, e.target.value)}
                        placeholder="Escriba la orden..."
                        rows={2}
                        className="resize-none flex-1 border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
                      />
                      {formData.ordenes.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOrden(index)}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
              <FileText className="h-4 w-4" />
              {isLoading ? "Guardando..." : existingRecord ? "Actualizar Registro" : "Guardar Registro"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
