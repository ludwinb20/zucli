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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadiologyOrderWithRelations } from "@/types/radiology";
import { Save, X, CheckCircle2, Edit2, User, Calendar, FileText } from "lucide-react";
import { InlineSpinner } from "@/components/ui/spinner";

interface RadiologyResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RadiologyOrderWithRelations | null;
  onSave: (orderId: string, data: {
    status?: string;
    findings?: string;
    diagnosis?: string;
    notes?: string;
  }) => Promise<void>;
}

export default function RadiologyResultsModal({
  isOpen,
  onClose,
  order,
  onSave,
}: RadiologyResultsModalProps) {
  const [protocol, setProtocol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (order) {
      // Protocolo se guarda en findings
      setProtocol(order.findings || "");
      // Cantidad se guarda en diagnosis
      setQuantity(order.diagnosis || "");
      setNotes(order.notes || "");
      // Si la orden está completada, empezar en modo no-edición
      setIsEditing(order.status !== 'completed');
    }
  }, [order]);

  const handleSubmit = async (markAsCompleted: boolean = false) => {
    if (!order) return;

    // Validar que protocolo y cantidad estén presentes si se va a marcar como completado
    if (markAsCompleted && (!protocol.trim() || !quantity.trim())) {
      return;
    }

    try {
      setSaving(true);
      
      const data: {
        findings?: string;
        diagnosis?: string;
        notes?: string;
        status?: string;
      } = {
        findings: protocol,
        diagnosis: quantity,
        notes,
      };

      if (markAsCompleted) {
        data.status = 'completed';
      }

      await onSave(order.id, data);
      
      if (markAsCompleted) {
        setIsEditing(false);
      }
      
      if (!markAsCompleted) {
        onClose();
      }
    } catch (error) {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setProtocol("");
      setQuantity("");
      setNotes("");
      setIsEditing(false);
      onClose();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Restaurar valores originales
    if (order) {
      setProtocol(order.findings || "");
      setQuantity(order.diagnosis || "");
      setNotes(order.notes || "");
    }
    setIsEditing(false);
  };

  if (!order) return null;

  const isCompleted = order.status === 'completed';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCompleted ? 'Resultados de Radiología' : 'Registrar Estudio de Radiología'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información del Paciente */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <h4 className="font-semibold text-gray-900 text-sm">Información del Paciente</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4 flex-shrink-0" />
                <div>
                  <span className="font-medium">{order.patient.firstName} {order.patient.lastName}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Identidad:</span>
                <span>{order.patient.identityNumber}</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Edad:</span>
                <span>{new Date().getFullYear() - new Date(order.patient.birthDate).getFullYear()} años</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Sexo:</span>
                <span>{order.patient.gender}</span>
              </div>
            </div>

            {/* Estudios Solicitados */}
            {order.payment.sale?.transactionItems && order.payment.sale.transactionItems.length > 0 && (
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0 text-[#2E9589]" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-700">Estudios Solicitados: </span>
                    <span className="text-gray-600">
                      {order.payment.sale?.transactionItems.map((item, index) => (
                        <span key={item.id}>
                          {item.nombre}
                          {item.quantity > 1 && ` (x${item.quantity})`}
                          {index < (order.payment.sale?.transactionItems?.length ?? 0) - 1 && ' • '}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Protocolo */}
          <div className="space-y-2">
            <Label htmlFor="protocol">
              Protocolo *
            </Label>
            <Textarea
              id="protocol"
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              placeholder="Descripción del protocolo utilizado..."
              rows={4}
              disabled={!isEditing || saving}
              className="resize-none"
            />
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Cantidad *
            </Label>
            <Input
              id="quantity"
              type="text"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ej: 2"
              disabled={!isEditing || saving}
            />
          </div>

          {/* Notas Adicionales */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notas (Opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
              disabled={!isEditing || saving}
              className="resize-none"
            />
          </div>

          {/* Información de Completado */}
          {isCompleted && order.completedAt && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Estudio Completado</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Fecha: {new Date(order.completedAt).toLocaleString('es-HN')}
              </p>
            </div>
          )}

        </div>

        {/* Footer con Botones */}
        <div className="flex justify-end gap-3 pt-4">
          {/* Botón Cerrar/Cancelar */}
          {(!isCompleted || !isEditing) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              {isCompleted ? 'Cerrar' : 'Cancelar'}
            </Button>
          )}

          {/* Botones cuando está completado pero NO editando */}
          {isCompleted && !isEditing && (
            <Button
              type="button"
              onClick={handleEdit}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}

          {/* Botones cuando está editando (pendiente o completado en edición) */}
          {isEditing && (
            <>
              {isCompleted && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancelar Edición
                </Button>
              )}

              {!isCompleted && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                >
                  {saving ? (
                    <InlineSpinner className="mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Borrador
                </Button>
              )}

              <Button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={saving || !protocol.trim() || !quantity.trim()}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                {saving ? (
                  <InlineSpinner className="mr-2" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {isCompleted ? 'Guardar Cambios' : 'Completar Estudio'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

