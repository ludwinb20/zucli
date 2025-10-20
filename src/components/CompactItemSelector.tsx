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
import { Plus, X } from "lucide-react";
import { TreatmentItem } from "@/types/components";
import { PriceWithRelations } from "@/types/prices";
import { InlineSpinner } from "@/components/ui/spinner";
import { PriceSearch } from "@/components/common/PriceSearch";

interface CompactItemSelectorProps {
  items: TreatmentItem[];
  onChange: (items: TreatmentItem[]) => void;
  specialtyId?: string;
  includeTags?: string[];
  excludeTags?: string[];
  prioritizeTags?: string[];
}

export function CompactItemSelector({ 
  items, 
  onChange,
  specialtyId,
  includeTags,
  excludeTags,
  prioritizeTags
}: CompactItemSelectorProps) {
  const [selectedPrice, setSelectedPrice] = useState<PriceWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");

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

    onChange([...items, itemToAdd]);
    
    // Resetear selección
    setSelectedPriceId("");
    setSelectedVariantId("");
    setQuantity("1");
  };

  const handleRemoveItem = (itemId: string) => {
    onChange(items.filter(item => item.id !== itemId));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    onChange(items.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const availableVariants = selectedPrice?.variants?.filter(v => v.isActive) || [];

  return (
    <div className="space-y-3">
      {/* Barra compacta de agregar items */}
      <div className="bg-gradient-to-r from-[#2E9589]/5 to-[#2E9589]/10 border border-[#2E9589]/20 rounded-lg p-3">
        <div className="flex items-end gap-2">
          {/* Búsqueda de item */}
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs text-gray-600 mb-1 block">
              Medicamento/Servicio
            </Label>
            <PriceSearch
              value={selectedPriceId}
              onChange={(value) => {
                setSelectedPriceId(value);
                setSelectedVariantId("");
              }}
              specialtyId={specialtyId}
              includeTags={includeTags}
              excludeTags={excludeTags}
              prioritizeTags={prioritizeTags}
              label=""
              placeholder="Buscar producto/servicio..."
              className="h-9"
            />
          </div>

          {/* Variante (si hay disponibles) */}
          {availableVariants.length > 0 && selectedPriceId && (
            <div className="w-40">
              <Label className="text-xs text-gray-600 mb-1 block">
                Variante
              </Label>
              <Select 
                value={selectedVariantId || "_base"} 
                onValueChange={(value) => setSelectedVariantId(value === "_base" ? "" : value)}
              >
                <SelectTrigger className="bg-white h-9 text-sm">
                  <SelectValue placeholder="Base" />
                </SelectTrigger>
                <SelectContent>
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
          <div className="w-24">
            <Label className="text-xs text-gray-600 mb-1 block">
              Cantidad
            </Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          {/* Botón Agregar */}
          <Button
            onClick={handleAddItem}
            disabled={!selectedPriceId || loading}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white h-9 px-4"
            size="sm"
          >
            {loading ? (
              <InlineSpinner size="sm" className="text-white" />
            ) : (
              <>
                <Plus size={16} className="mr-1" />
                Agregar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lista de items agregados - Compacta */}
      {items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label className="text-xs font-medium text-gray-700">
              Items agregados ({items.length})
            </Label>
            <span className="text-sm font-semibold text-[#2E9589]">
              Total: L {calculateTotal().toFixed(2)}
            </span>
          </div>

          <div className="space-y-1.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 bg-white border border-gray-200 rounded-md hover:border-[#2E9589]/30 transition-colors group"
              >
                {/* Info del item */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-xs text-gray-500 truncate">
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Cantidad */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Cant:</span>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                    className="w-14 h-7 text-xs text-center"
                  />
                </div>

                {/* Precio unitario */}
                <div className="text-right w-20">
                  <p className="text-xs text-gray-500">Unit.</p>
                  <p className="text-sm font-medium text-gray-700">
                    L {item.price.toFixed(2)}
                  </p>
                </div>

                {/* Subtotal */}
                <div className="text-right w-24">
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="text-sm font-semibold text-[#2E9589]">
                    L {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                {/* Botón eliminar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(item.id)}
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío - Más compacto */}
      {items.length === 0 && (
        <div className="text-center py-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg">
          <p className="text-xs text-gray-500">
            Sin items agregados. Use el buscador arriba para agregar.
          </p>
        </div>
      )}
    </div>
  );
}

