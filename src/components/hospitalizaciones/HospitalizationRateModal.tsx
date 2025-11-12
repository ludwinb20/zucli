"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { HospitalizationWithRelations } from "@/types/hospitalization";
import { InlineSpinner } from "@/components/ui/spinner";
import { AlertCircle, DollarSign } from "lucide-react";

interface HospitalizationRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalization: HospitalizationWithRelations | null;
  onSuccess: () => void;
}

interface VariantOption {
  id: string;
  name: string;
  price: number;
  isActive?: boolean;
}

export default function HospitalizationRateModal({
  isOpen,
  onClose,
  hospitalization,
  onSuccess,
}: HospitalizationRateModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  useEffect(() => {
    if (isOpen && hospitalization?.dailyRateItem) {
      setSelectedVariantId(hospitalization.dailyRateVariant?.id || "");
      setBasePrice(hospitalization.dailyRateItem.basePrice ?? null);
      const localVariants = hospitalization.dailyRateItem.variants;

      if (localVariants && localVariants.length > 0) {
        setVariants(localVariants.filter((variant) => variant.isActive !== false));
      } else {
        void fetchVariants(hospitalization.dailyRateItem.id);
      }
    }

    if (!isOpen) {
      setVariants([]);
      setLoading(false);
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, hospitalization?.id]);

  const fetchVariants = async (serviceItemId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/prices/${serviceItemId}`);
      if (!response.ok) {
        throw new Error();
      }
      const data = await response.json();
      const fetchedVariants: VariantOption[] = data.price?.variants || [];
      setVariants(fetchedVariants.filter((variant) => variant.isActive !== false));
      setBasePrice(data.price?.basePrice ?? null);
    } catch (error) {
      console.error("Error loading variants:", error);
      toast({
        title: "No se pudieron cargar las variantes",
        description: "Intente de nuevo más tarde",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hospitalization) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/hospitalizations/${hospitalization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyRateVariantId: selectedVariantId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar la tarifa diaria");
      }

      toast({
        title: "Tarifa actualizada",
        description: "La variante del costo diario se ha actualizado correctamente",
        variant: "success",
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar la tarifa diaria",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!hospitalization?.dailyRateItem) {
    return null;
  }

  const hasVariants = variants.length > 0;

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/D";
    return `L${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <DollarSign className="h-5 w-5 text-[#2E9589]" />
            Ajustar tarifa diaria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="font-semibold text-gray-900">{hospitalization.dailyRateItem.name}</p>
            <p className="text-gray-600 mt-1">
              Precio base actual: <span className="font-semibold">{formatCurrency(basePrice)}</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Seleccione una variante para actualizar el costo diario de la hospitalización. El cambio aplica para el cálculo del alta y los pagos asociados.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <InlineSpinner />
            </div>
          ) : hasVariants ? (
            <RadioGroup
              value={selectedVariantId || "_base"}
              onValueChange={(value) => setSelectedVariantId(value === "_base" ? "" : value)}
              className="space-y-3"
            >
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                <RadioGroupItem value="_base" id="daily-rate-base" className="mt-1" />
                <div>
                  <Label htmlFor="daily-rate-base" className="text-sm font-medium text-gray-900">
                    Precio base
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Tarifa estándar: {formatCurrency(basePrice)} por día
                  </p>
                </div>
              </div>

              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
                >
                  <RadioGroupItem value={variant.id} id={`variant-${variant.id}`} className="mt-1" />
                  <div>
                    <Label
                      htmlFor={`variant-${variant.id}`}
                      className="text-sm font-medium text-gray-900"
                    >
                      {variant.name}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Tarifa: {formatCurrency(variant.price)} por día
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Este servicio no tiene variantes configuradas.</p>
                <p className="text-xs mt-1">
                  Si necesita manejar distintos tipos de habitaciones o tarifas, agregue variantes al servicio desde el panel de administración.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button variant="outline" onClick={handleClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading || (!hasVariants && selectedVariantId !== "")}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {saving ? <InlineSpinner className="mr-2" /> : null}
              Guardar cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
