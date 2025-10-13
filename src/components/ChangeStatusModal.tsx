'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppointmentStatus } from '@/types/appointments';
import { ChangeStatusModalProps } from '@/types/components';

export default function ChangeStatusModal({
  isOpen,
  onClose,
  appointment,
  newStatus,
  onSave,
  isLoading = false
}: ChangeStatusModalProps) {
  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && appointment) {
      // Modal initialization
    }
  }, [isOpen, appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment) {
      return;
    }

    try {
      await onSave(appointment.id, newStatus);
    } catch (error) {
      console.error('Error changing status:', error);
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case 'pendiente':
        return 'Marcar como Pendiente';
      case 'cancelado':
        return 'Cancelar Cita';
      default:
        return status;
    }
  };

  const getStatusDescription = (status: AppointmentStatus) => {
    switch (status) {
      case 'pendiente':
        return 'Marcar esta cita como pendiente';
      case 'cancelado':
        return 'Cancelar esta cita permanentemente';
      default:
        return `Cambiar el estado a ${status}`;
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {getStatusLabel(newStatus as AppointmentStatus)}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {getStatusDescription(newStatus as AppointmentStatus)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className={`${newStatus === 'cancelado' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#2E9589] hover:bg-[#2E9589]/90'} text-white`}
            >
              {isLoading ? 'Procesando...' : getStatusLabel(newStatus as AppointmentStatus)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
