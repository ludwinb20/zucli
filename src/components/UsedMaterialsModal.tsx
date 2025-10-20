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
import { Package, X, Save } from "lucide-react";
import { CreateUsedMaterialsData, UsedMaterials } from "@/types/surgery";
import { useToast } from "@/hooks/use-toast";

interface UsedMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  surgeryId: string;
  existingMaterials?: UsedMaterials | null;
  onSave: () => void;
}

// Componente de Input reutilizable (fuera del componente principal para evitar re-renders)
const TextInput = ({ 
  label, 
  field, 
  value, 
  onChange 
}: { 
  label: string; 
  field: string;
  value: string | undefined;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <Label htmlFor={field} className="text-sm font-medium text-gray-700">{label}</Label>
    <Input
      id={field}
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Cantidad/descripción de ${label.toLowerCase()}...`}
      className="border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
    />
  </div>
);

export default function UsedMaterialsModal({
  isOpen,
  onClose,
  surgeryId,
  existingMaterials,
  onSave,
}: UsedMaterialsModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUsedMaterialsData>({
    gasas: "",
    torundas: "",
    compresas: "",
    aseptosan: "",
    cloruro: "",
    povedine: "",
    sondaFoley: "",
    bolsaRecolectoraOrina: "",
    bisturiNo: "",
    guantesEsterilesTallas: "",
    suturas: "",
    espadadraspo: "",
    jeringas: "",
    bolsaMuestraBiopsia: "",
    manigtas: "",
    lubricante: "",
    otros: "",
  });

  useEffect(() => {
    if (isOpen && existingMaterials) {
      setFormData({
        gasas: existingMaterials.gasas || "",
        torundas: existingMaterials.torundas || "",
        compresas: existingMaterials.compresas || "",
        aseptosan: existingMaterials.aseptosan || "",
        cloruro: existingMaterials.cloruro || "",
        povedine: existingMaterials.povedine || "",
        sondaFoley: existingMaterials.sondaFoley || "",
        bolsaRecolectoraOrina: existingMaterials.bolsaRecolectoraOrina || "",
        bisturiNo: existingMaterials.bisturiNo || "",
        guantesEsterilesTallas: existingMaterials.guantesEsterilesTallas || "",
        suturas: existingMaterials.suturas || "",
        espadadraspo: existingMaterials.espadadraspo || "",
        jeringas: existingMaterials.jeringas || "",
        bolsaMuestraBiopsia: existingMaterials.bolsaMuestraBiopsia || "",
        manigtas: existingMaterials.manigtas || "",
        lubricante: existingMaterials.lubricante || "",
        otros: existingMaterials.otros || "",
      });
    }
  }, [isOpen, existingMaterials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const method = existingMaterials ? "PUT" : "POST";
      const response = await fetch(`/api/surgeries/${surgeryId}/used-materials`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar materiales");
      }

      toast({
        title: "Éxito",
        description: existingMaterials
          ? "Materiales utilizados actualizados correctamente"
          : "Materiales utilizados registrados correctamente",
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
            {existingMaterials ? "Editar Materiales Utilizados" : "Registrar Materiales Utilizados"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextInput label="Gasas" field="gasas" value={formData.gasas} onChange={(v) => setFormData(prev => ({ ...prev, gasas: v }))} />
            <TextInput label="Torundas" field="torundas" value={formData.torundas} onChange={(v) => setFormData(prev => ({ ...prev, torundas: v }))} />
            <TextInput label="Compresas" field="compresas" value={formData.compresas} onChange={(v) => setFormData(prev => ({ ...prev, compresas: v }))} />
            <TextInput label="Aseptosan" field="aseptosan" value={formData.aseptosan} onChange={(v) => setFormData(prev => ({ ...prev, aseptosan: v }))} />
            <TextInput label="Cloruro" field="cloruro" value={formData.cloruro} onChange={(v) => setFormData(prev => ({ ...prev, cloruro: v }))} />
            <TextInput label="Povedine" field="povedine" value={formData.povedine} onChange={(v) => setFormData(prev => ({ ...prev, povedine: v }))} />
            <TextInput label="Sonda Foley" field="sondaFoley" value={formData.sondaFoley} onChange={(v) => setFormData(prev => ({ ...prev, sondaFoley: v }))} />
            <TextInput label="Bolsa Recolectora de Orina" field="bolsaRecolectoraOrina" value={formData.bolsaRecolectoraOrina} onChange={(v) => setFormData(prev => ({ ...prev, bolsaRecolectoraOrina: v }))} />
            <TextInput label="Bisturí No." field="bisturiNo" value={formData.bisturiNo} onChange={(v) => setFormData(prev => ({ ...prev, bisturiNo: v }))} />
            <TextInput label="Guantes Estériles Tallas" field="guantesEsterilesTallas" value={formData.guantesEsterilesTallas} onChange={(v) => setFormData(prev => ({ ...prev, guantesEsterilesTallas: v }))} />
            <TextInput label="Espadadraspo" field="espadadraspo" value={formData.espadadraspo} onChange={(v) => setFormData(prev => ({ ...prev, espadadraspo: v }))} />
            <TextInput label="Jeringas" field="jeringas" value={formData.jeringas} onChange={(v) => setFormData(prev => ({ ...prev, jeringas: v }))} />
            <TextInput label="Bolsa para Muestra Biopsia" field="bolsaMuestraBiopsia" value={formData.bolsaMuestraBiopsia} onChange={(v) => setFormData(prev => ({ ...prev, bolsaMuestraBiopsia: v }))} />
            <TextInput label="Maniguetas" field="manigtas" value={formData.manigtas} onChange={(v) => setFormData(prev => ({ ...prev, manigtas: v }))} />
            <TextInput label="Lubricante" field="lubricante" value={formData.lubricante} onChange={(v) => setFormData(prev => ({ ...prev, lubricante: v }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="suturas" className="text-sm font-medium text-gray-700">Suturas</Label>
            <Textarea
              id="suturas"
              value={formData.suturas}
              onChange={(e) => setFormData(prev => ({ ...prev, suturas: e.target.value }))}
              placeholder="Lista de suturas utilizadas..."
              rows={3}
              className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otros" className="text-sm font-medium text-gray-700">Otros Materiales</Label>
            <Textarea
              id="otros"
              value={formData.otros}
              onChange={(e) => setFormData(prev => ({ ...prev, otros: e.target.value }))}
              placeholder="Otros materiales utilizados..."
              rows={3}
              className="resize-none border-gray-300 focus:ring-2 focus:ring-[#2E9589] focus:border-transparent"
            />
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
              {isLoading ? "Guardando..." : existingMaterials ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

