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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, X, Save } from "lucide-react";
import { CreateMaterialControlData, MaterialControlMoment } from "@/types/surgery";
import { useToast } from "@/hooks/use-toast";

interface MaterialControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgeryId: string;
  moment: MaterialControlMoment;
  onSave: () => void;
}

// Componente de Input numérico (fuera del componente principal para evitar re-renders)
const NumberInput = ({ 
  label, 
  field, 
  value, 
  onChange 
}: { 
  label: string; 
  field: string;
  value: number | undefined;
  onChange: (value: number) => void;
}) => (
  <div className="space-y-1">
    <Label htmlFor={field} className="text-xs font-medium text-gray-700">{label}</Label>
    <Input
      id={field}
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
    />
  </div>
);

export default function MaterialControlModal({
  isOpen,
  onClose,
  surgeryId,
  moment,
  onSave,
}: MaterialControlModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [existingRecord, setExistingRecord] = useState<Record<string, unknown> | null>(null);
  const [formData, setFormData] = useState<Omit<CreateMaterialControlData, 'moment'>>({
    tijerasMetzembaumCurvas: 0,
    tijerasMetzembaumRectas: 0,
    tijeraMayoCurvas: 0,
    tijeraMayoRectas: 0,
    mangoBisturi: 0,
    hemostaticaCurvas: 0,
    hemostaticaRectas: 0,
    pinzaKellyCurvas: 0,
    pinzaKellyRectas: 0,
    pinzaKochersCurvas: 0,
    pinzaKorchersRectas: 0,
    pinzaMosquitoCurvas: 0,
    pinzaMosquitoRectas: 0,
    pinzaAllis: 0,
    pinzaBabcock: 0,
    pinzaCampo: 0,
    pinzaDiseccionSinDientes: 0,
    pinzaDiseccionConDientes: 0,
    pinzaAnillo: 0,
    pinzaGinecologicas: 0,
    pinzaMixter: 0,
    portagujas: 0,
    separadores: 0,
    pinzaPeam: 0,
    otrosSeparadores: 0,
    otrasPinzas: 0,
    otros: 0,
    cromico: 0,
    sedas: 0,
    nylon: 0,
    poliglactinaVicryl: 0,
    otrasSuturas: 0,
    otrosSuturas: 0,
  });

  const momentLabels = {
    pre: "Pre-Quirúrgico",
    trans: "Trans-Quirúrgico",
    final: "Final"
  };

  // Cargar datos existentes cuando se abre el modal
  useEffect(() => {
    const loadExistingData = async () => {
      if (!isOpen) return;

      try {
        const response = await fetch(`/api/surgeries/${surgeryId}/material-controls?moment=${moment}`);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setExistingRecord(data);
            setFormData({
              tijerasMetzembaumCurvas: data.tijerasMetzembaumCurvas || 0,
              tijerasMetzembaumRectas: data.tijerasMetzembaumRectas || 0,
              tijeraMayoCurvas: data.tijeraMayoCurvas || 0,
              tijeraMayoRectas: data.tijeraMayoRectas || 0,
              mangoBisturi: data.mangoBisturi || 0,
              hemostaticaCurvas: data.hemostaticaCurvas || 0,
              hemostaticaRectas: data.hemostaticaRectas || 0,
              pinzaKellyCurvas: data.pinzaKellyCurvas || 0,
              pinzaKellyRectas: data.pinzaKellyRectas || 0,
              pinzaKochersCurvas: data.pinzaKochersCurvas || 0,
              pinzaKorchersRectas: data.pinzaKorchersRectas || 0,
              pinzaMosquitoCurvas: data.pinzaMosquitoCurvas || 0,
              pinzaMosquitoRectas: data.pinzaMosquitoRectas || 0,
              pinzaAllis: data.pinzaAllis || 0,
              pinzaBabcock: data.pinzaBabcock || 0,
              pinzaCampo: data.pinzaCampo || 0,
              pinzaDiseccionSinDientes: data.pinzaDiseccionSinDientes || 0,
              pinzaDiseccionConDientes: data.pinzaDiseccionConDientes || 0,
              pinzaAnillo: data.pinzaAnillo || 0,
              pinzaGinecologicas: data.pinzaGinecologicas || 0,
              pinzaMixter: data.pinzaMixter || 0,
              portagujas: data.portagujas || 0,
              separadores: data.separadores || 0,
              pinzaPeam: data.pinzaPeam || 0,
              otrosSeparadores: data.otrosSeparadores || 0,
              otrasPinzas: data.otrasPinzas || 0,
              otros: data.otros || 0,
              cromico: data.cromico || 0,
              sedas: data.sedas || 0,
              nylon: data.nylon || 0,
              poliglactinaVicryl: data.poliglactinaVicryl || 0,
              otrasSuturas: data.otrasSuturas || 0,
              otrosSuturas: data.otrosSuturas || 0,
            });
          } else {
            // No hay datos existentes, reiniciar formulario
            setExistingRecord(null);
            setFormData({
              tijerasMetzembaumCurvas: 0,
              tijerasMetzembaumRectas: 0,
              tijeraMayoCurvas: 0,
              tijeraMayoRectas: 0,
              mangoBisturi: 0,
              hemostaticaCurvas: 0,
              hemostaticaRectas: 0,
              pinzaKellyCurvas: 0,
              pinzaKellyRectas: 0,
              pinzaKochersCurvas: 0,
              pinzaKorchersRectas: 0,
              pinzaMosquitoCurvas: 0,
              pinzaMosquitoRectas: 0,
              pinzaAllis: 0,
              pinzaBabcock: 0,
              pinzaCampo: 0,
              pinzaDiseccionSinDientes: 0,
              pinzaDiseccionConDientes: 0,
              pinzaAnillo: 0,
              pinzaGinecologicas: 0,
              pinzaMixter: 0,
              portagujas: 0,
              separadores: 0,
              pinzaPeam: 0,
              otrosSeparadores: 0,
              otrasPinzas: 0,
              otros: 0,
              cromico: 0,
              sedas: 0,
              nylon: 0,
              poliglactinaVicryl: 0,
              otrasSuturas: 0,
              otrosSuturas: 0,
            });
          }
        }
      } catch (error) {
        console.error('Error al cargar control de materiales:', error);
      }
    };

    loadExistingData();
  }, [isOpen, surgeryId, moment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const method = existingRecord ? "PUT" : "POST";
      const response = await fetch(`/api/surgeries/${surgeryId}/material-controls`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          moment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar control de materiales");
      }

      toast({
        title: "Éxito",
        description: existingRecord 
          ? `Control de materiales (${momentLabels[moment]}) actualizado correctamente`
          : `Control de materiales (${momentLabels[moment]}) creado correctamente`,
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#2E9589]" />
            {existingRecord ? "Editar" : "Registrar"} Control de Materiales - {momentLabels[moment]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="instrumentos" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instrumentos">Instrumentos</TabsTrigger>
              <TabsTrigger value="suturas">Suturas</TabsTrigger>
            </TabsList>

            {/* TAB: Instrumentos */}
            <TabsContent value="instrumentos" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NumberInput label="Tijeras Metzembaum Curvas" field="tijerasMetzembaumCurvas" value={formData.tijerasMetzembaumCurvas} onChange={(v) => setFormData(prev => ({ ...prev, tijerasMetzembaumCurvas: v }))} />
                <NumberInput label="Tijeras Metzembaum Rectas" field="tijerasMetzembaumRectas" value={formData.tijerasMetzembaumRectas} onChange={(v) => setFormData(prev => ({ ...prev, tijerasMetzembaumRectas: v }))} />
                <NumberInput label="Tijera Mayo Curvas" field="tijeraMayoCurvas" value={formData.tijeraMayoCurvas} onChange={(v) => setFormData(prev => ({ ...prev, tijeraMayoCurvas: v }))} />
                <NumberInput label="Tijera Mayo Rectas" field="tijeraMayoRectas" value={formData.tijeraMayoRectas} onChange={(v) => setFormData(prev => ({ ...prev, tijeraMayoRectas: v }))} />
                <NumberInput label="Mango de Bisturí" field="mangoBisturi" value={formData.mangoBisturi} onChange={(v) => setFormData(prev => ({ ...prev, mangoBisturi: v }))} />
                <NumberInput label="Hemostática Curvas" field="hemostaticaCurvas" value={formData.hemostaticaCurvas} onChange={(v) => setFormData(prev => ({ ...prev, hemostaticaCurvas: v }))} />
                <NumberInput label="Hemostática Rectas" field="hemostaticaRectas" value={formData.hemostaticaRectas} onChange={(v) => setFormData(prev => ({ ...prev, hemostaticaRectas: v }))} />
                <NumberInput label="Pinza Kelly Curvas" field="pinzaKellyCurvas" value={formData.pinzaKellyCurvas} onChange={(v) => setFormData(prev => ({ ...prev, pinzaKellyCurvas: v }))} />
                <NumberInput label="Pinza Kelly Rectas" field="pinzaKellyRectas" value={formData.pinzaKellyRectas} onChange={(v) => setFormData(prev => ({ ...prev, pinzaKellyRectas: v }))} />
                <NumberInput label="Pinza Kochers Curvas" field="pinzaKochersCurvas" value={formData.pinzaKochersCurvas} onChange={(v) => setFormData(prev => ({ ...prev, pinzaKochersCurvas: v }))} />
                <NumberInput label="Pinza Korchers Rectas" field="pinzaKorchersRectas" value={formData.pinzaKorchersRectas} onChange={(v) => setFormData(prev => ({ ...prev, pinzaKorchersRectas: v }))} />
                <NumberInput label="Pinza Mosquito Curvas" field="pinzaMosquitoCurvas" value={formData.pinzaMosquitoCurvas} onChange={(v) => setFormData(prev => ({ ...prev, pinzaMosquitoCurvas: v }))} />
                <NumberInput label="Pinza Mosquito Rectas" field="pinzaMosquitoRectas" value={formData.pinzaMosquitoRectas} onChange={(v) => setFormData(prev => ({ ...prev, pinzaMosquitoRectas: v }))} />
                <NumberInput label="Pinza Allis" field="pinzaAllis" value={formData.pinzaAllis} onChange={(v) => setFormData(prev => ({ ...prev, pinzaAllis: v }))} />
                <NumberInput label="Pinza Babcock" field="pinzaBabcock" value={formData.pinzaBabcock} onChange={(v) => setFormData(prev => ({ ...prev, pinzaBabcock: v }))} />
                <NumberInput label="Pinza de Campo" field="pinzaCampo" value={formData.pinzaCampo} onChange={(v) => setFormData(prev => ({ ...prev, pinzaCampo: v }))} />
                <NumberInput label="Pinza Disección s/dientes" field="pinzaDiseccionSinDientes" value={formData.pinzaDiseccionSinDientes} onChange={(v) => setFormData(prev => ({ ...prev, pinzaDiseccionSinDientes: v }))} />
                <NumberInput label="Pinza Disección c/dientes" field="pinzaDiseccionConDientes" value={formData.pinzaDiseccionConDientes} onChange={(v) => setFormData(prev => ({ ...prev, pinzaDiseccionConDientes: v }))} />
                <NumberInput label="Pinza de Anillo" field="pinzaAnillo" value={formData.pinzaAnillo} onChange={(v) => setFormData(prev => ({ ...prev, pinzaAnillo: v }))} />
                <NumberInput label="Pinza Ginecológica" field="pinzaGinecologicas" value={formData.pinzaGinecologicas} onChange={(v) => setFormData(prev => ({ ...prev, pinzaGinecologicas: v }))} />
                <NumberInput label="Pinza Mixter" field="pinzaMixter" value={formData.pinzaMixter} onChange={(v) => setFormData(prev => ({ ...prev, pinzaMixter: v }))} />
                <NumberInput label="Portagujas" field="portagujas" value={formData.portagujas} onChange={(v) => setFormData(prev => ({ ...prev, portagujas: v }))} />
                <NumberInput label="Separadores" field="separadores" value={formData.separadores} onChange={(v) => setFormData(prev => ({ ...prev, separadores: v }))} />
                <NumberInput label="Pinza Peam" field="pinzaPeam" value={formData.pinzaPeam} onChange={(v) => setFormData(prev => ({ ...prev, pinzaPeam: v }))} />
                <NumberInput label="Otros Separadores" field="otrosSeparadores" value={formData.otrosSeparadores} onChange={(v) => setFormData(prev => ({ ...prev, otrosSeparadores: v }))} />
                <NumberInput label="Otras Pinzas" field="otrasPinzas" value={formData.otrasPinzas} onChange={(v) => setFormData(prev => ({ ...prev, otrasPinzas: v }))} />
                <NumberInput label="Otros" field="otros" value={formData.otros} onChange={(v) => setFormData(prev => ({ ...prev, otros: v }))} />
              </div>
            </TabsContent>

            {/* TAB: Suturas */}
            <TabsContent value="suturas" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <NumberInput label="Crómico" field="cromico" value={formData.cromico} onChange={(v) => setFormData(prev => ({ ...prev, cromico: v }))} />
                <NumberInput label="Sedas" field="sedas" value={formData.sedas} onChange={(v) => setFormData(prev => ({ ...prev, sedas: v }))} />
                <NumberInput label="Nylon" field="nylon" value={formData.nylon} onChange={(v) => setFormData(prev => ({ ...prev, nylon: v }))} />
                <NumberInput label="Poliglactina (Vicryl)" field="poliglactinaVicryl" value={formData.poliglactinaVicryl} onChange={(v) => setFormData(prev => ({ ...prev, poliglactinaVicryl: v }))} />
                <NumberInput label="Otras Suturas" field="otrasSuturas" value={formData.otrasSuturas} onChange={(v) => setFormData(prev => ({ ...prev, otrasSuturas: v }))} />
                <NumberInput label="Otros" field="otrosSuturas" value={formData.otrosSuturas} onChange={(v) => setFormData(prev => ({ ...prev, otrosSuturas: v }))} />
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
              {isLoading ? "Guardando..." : existingRecord ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

