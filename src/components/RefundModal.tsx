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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, X, Save } from "lucide-react";
import { CreateRefundData } from "@/types/payments";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  paymentTotal: number;
  totalRefunded: number;
  onSave: () => void;
}

export default function RefundModal({
  isOpen,
  onClose,
  paymentId,
  paymentTotal,
  totalRefunded,
  onSave,
}: RefundModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    reason: "",
  });

  const availableAmount = paymentTotal - totalRefunded;

  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: "",
        reason: "",
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);

    // Validaciones
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "error",
      });
      return;
    }

    if (amount > availableAmount) {
      toast({
        title: "Error",
        description: `El monto excede el disponible. Máximo: L. ${availableAmount.toFixed(2)}`,
        variant: "error",
      });
      return;
    }

    if (!formData.reason.trim()) {
      toast({
        title: "Error",
        description: "El motivo es requerido",
        variant: "error",
      });
      return;
    }

    try {
      setIsLoading(true);

      const refundData: CreateRefundData = {
        paymentId,
        amount,
        reason: formData.reason.trim(),
      };

      const response = await fetch(`/api/payments/${paymentId}/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(refundData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear reembolso");
      }

      toast({
        title: "Éxito",
        description: "Reembolso registrado correctamente",
      });

      onSave();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear reembolso",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            Registrar Reembolso
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Pago */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total del Pago:</span>
              <span className="font-semibold text-gray-900">L. {paymentTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Reembolsado:</span>
              <span className="font-semibold text-red-600">- L. {totalRefunded.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
              <span className="text-gray-700 font-medium">Disponible:</span>
              <span className="font-bold text-[#2E9589]">L. {availableAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Monto del Reembolso */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
              Monto a Reembolsar *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">L.</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={availableAmount}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="pl-9 border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500">
              Máximo disponible: L. {availableAmount.toFixed(2)}
            </p>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium text-gray-700">
              Motivo del Reembolso *
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Describe el motivo del reembolso..."
              rows={4}
              className="resize-none border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Guardando..." : "Registrar Reembolso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

