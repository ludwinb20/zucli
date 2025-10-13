'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReprogramAppointmentModalProps } from '@/types/components';

export default function ReprogramAppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSave,
  isLoading = false
}: ReprogramAppointmentModalProps) {
  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && appointment) {
      const appointmentDate = new Date(appointment.date as string);
      setFormData({
        appointmentDate: appointmentDate.toISOString().split('T')[0],
        appointmentTime: appointmentDate.toTimeString().slice(0, 5)
      });
      setErrors({});
    }
  }, [isOpen, appointment]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'La fecha es requerida';
    }

    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'La hora es requerida';
    }

    // Validar que la fecha no sea en el pasado
    if (formData.appointmentDate && formData.appointmentTime) {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      const now = new Date();
      
      if (appointmentDateTime < now) {
        newErrors.appointmentDate = 'La fecha y hora no pueden ser en el pasado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !appointment) {
      return;
    }

    try {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      await onSave(appointment.id, appointmentDateTime);
    } catch (error) {
      console.error('Error reprogramming appointment:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Reprogramar Cita
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Selecciona la nueva fecha y hora para esta cita
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700">Nueva Fecha *</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.appointmentDate ? 'border-red-500' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.appointmentDate && (
                <p className="text-sm text-red-500">{errors.appointmentDate}</p>
              )}
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <Label htmlFor="appointmentTime" className="text-sm font-medium text-gray-700">Nueva Hora *</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={formData.appointmentTime}
                onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.appointmentTime ? 'border-red-500' : ''}`}
              />
              {errors.appointmentTime && (
                <p className="text-sm text-red-500">{errors.appointmentTime}</p>
              )}
            </div>
          </div>

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
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {isLoading ? 'Reprogramando...' : 'Reprogramar Cita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
