"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { TreatmentItem } from "@/types/components";
import { PriceWithRelations } from "@/types/prices";
import { InlineSpinner } from "@/components/ui/spinner";
import { PriceSearch } from "@/components/common/PriceSearch";

interface AddItemPopoverProps {
  onAddItem: (item: TreatmentItem) => void;
  specialtyId?: string;
  triggerClassName?: string;
}

export function AddItemPopover({ 
  onAddItem,
  specialtyId,
  triggerClassName 
}: AddItemPopoverProps) {
  const [selectedPrice, setSelectedPrice] = useState<PriceWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Cargar detalles del precio seleccionado (con variantes)
  useEffect(() => {
    if (selectedPriceId) {
      loadPriceDetails(selectedPriceId);
    } else {
      setSelectedPrice(null);
      setSelectedVariantId("");
    }
  }, [selectedPriceId]);

  const loadPriceDetails = async (priceId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/prices/${priceId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPrice(data.price);
      }
    } catch (error) {
      console.error("Error loading price details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedPriceId || !selectedPrice) return;

    let itemToAdd: TreatmentItem;
    
    if (selectedVariantId) {
      // Agregar variante
      const selectedVariant = selectedPrice.variants.find(v => v.id === selectedVariantId);
      if (!selectedVariant) return;
      
      itemToAdd = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'variant',
        priceId: selectedPrice.id,
        variantId: selectedVariant.id,
        name: `${selectedPrice.name} - ${selectedVariant.name}`,
        description: selectedVariant.description || undefined,
        price: selectedVariant.price,
        quantity: parseInt(quantity) || 1,
      };
    } else {
      // Agregar precio base
      itemToAdd = {
        id: `${Date.now()}-${Math.random()}`,
        type: 'price',
        priceId: selectedPrice.id,
        name: selectedPrice.name,
        description: selectedPrice.description || undefined,
        price: selectedPrice.basePrice,
        quantity: parseInt(quantity) || 1,
      };
    }

    onAddItem(itemToAdd);
    
    // Resetear selección
    setSelectedPriceId("");
    setSelectedVariantId("");
    setQuantity("1");
    setPopoverOpen(false); // Cerrar el popover
  };

  const availableVariants = selectedPrice?.variants?.filter(v => v.isActive) || [];

  if (loading) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={triggerClassName}
      >
        <InlineSpinner size="sm" />
      </Button>
    );
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={triggerClassName || "border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"}
        >
          <Plus size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[600px] p-4 bg-white border-2 border-[#2E9589] z-99999"
        align="end"
      >
        <div className="grid grid-cols-12 gap-3 items-end">
          {/* Seleccionar Precio/Medicamento con búsqueda */}
          <div className="col-span-5 space-y-1">
            <PriceSearch
              value={selectedPriceId}
              onChange={(value) => {
                setSelectedPriceId(value);
                setSelectedVariantId("");
              }}
              specialtyId={specialtyId}
              label=""
              placeholder="Buscar..."
            />
          </div>

          {/* Seleccionar Variante (si hay disponibles) */}
          {availableVariants.length > 0 && selectedPriceId && (
            <div className="col-span-3 space-y-1">
              <Label htmlFor="variant-select" className="text-xs text-gray-600 font-medium">
                Variante
              </Label>
              <Select value={selectedVariantId || "_base"} onValueChange={(value) => setSelectedVariantId(value === "_base" ? "" : value)}>
                <SelectTrigger 
                  id="variant-select"
                  className="bg-white border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] h-9"
                >
                  <SelectValue placeholder="Base" />
                </SelectTrigger>
                <SelectContent className="z-[99999]">
                  <SelectItem value="_base">Precio base</SelectItem>
                  {availableVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name} - L {variant.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Cantidad */}
          <div className={`${availableVariants.length > 0 && selectedPriceId ? 'col-span-2' : 'col-span-5'} space-y-1`}>
            <Label htmlFor="quantity-input" className="text-xs text-gray-600 font-medium">
              Cantidad
            </Label>
            <Input
              id="quantity-input"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] h-9"
            />
          </div>

          {/* Botón Agregar */}
          <div className="col-span-2">
            <Button
              onClick={handleAddItem}
              disabled={!selectedPriceId}
              className="w-full bg-[#2E9589] hover:bg-[#2E9589]/90 text-white h-9"
              size="sm"
            >
              Agregar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

