"use client";

import React, { useState, useEffect } from "react";
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
import { X, Save } from "lucide-react";

interface CustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    name: string;
    price: number;
    quantity: number;
  }) => void;
  initialItem?: {
    name: string;
    price: number;
    quantity: number;
  } | null;
}

export default function CustomItemModal({
  isOpen,
  onClose,
  onSave,
  initialItem,
}: CustomItemModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setName(initialItem.name);
        setPrice(initialItem.price.toString());
        setQuantity(initialItem.quantity.toString());
      } else {
        setName("");
        setPrice("");
        setQuantity("1");
      }
      setError("");
    }
  }, [isOpen, initialItem]);

  const handleSubmit = () => {
    setError("");

    // Validaciones
    if (!name.trim()) {
      setError("La descripción es requerida");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("El precio debe ser mayor a 0");
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    onSave({
      name: name.trim(),
      price: priceNum,
      quantity: quantityNum,
    });

    handleClose();
  };

  const handleClose = () => {
    setName("");
    setPrice("");
    setQuantity("1");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {initialItem ? "Editar Item Variable" : "Agregar Item Variable"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Descripción *
            </Label>
            <Textarea
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Consulta especial, Material médico, etc."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Precio */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium text-gray-700">
              Precio Unitario (ISV incluido) *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                L
              </span>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="pl-8"
              />
            </div>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
              Cantidad *
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              min="1"
              step="1"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              <Save size={16} className="mr-2" />
              {initialItem ? "Guardar Cambios" : "Agregar Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

