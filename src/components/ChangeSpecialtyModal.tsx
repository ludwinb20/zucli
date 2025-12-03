'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChangeSpecialtyModalProps } from '@/types/components';

export default function ChangeSpecialtyModal({
  isOpen,
  onClose,
  appointment,
  specialties,
  onSave,
  isLoading = false
}: ChangeSpecialtyModalProps) {
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && appointment) {
      setSelectedSpecialtyId(appointment.specialtyId);
      setErrors({});
    }
  }, [isOpen, appointment]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedSpecialtyId) {
      newErrors.specialtyId = 'La especialidad es requerida';
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
      await onSave(appointment.id, selectedSpecialtyId);
    } catch (error) {
      console.error('Error changing specialty:', error);
    }
  };

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialtyId(value);
    if (errors.specialtyId) {
      setErrors(prev => ({
        ...prev,
        specialtyId: ''
      }));
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Cambiar Especialidad
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Selecciona la nueva especialidad para esta cita
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="specialtyId" className="text-sm font-medium text-gray-700">Nueva Especialidad *</Label>
            <Select
              value={selectedSpecialtyId}
              onValueChange={handleSpecialtyChange}
            >
              <SelectTrigger className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.specialtyId ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Seleccionar especialidad" />
              </SelectTrigger>
              <SelectContent 
                position="popper"
                sideOffset={5}
                collisionPadding={8}
                className="max-h-[300px]"
              >
                {specialties.map((specialty) => {
                  const specialists = Array.isArray(specialty.users) ? specialty.users : [];
                  const specialistNames = specialists
                    .map((user: { name: string }) => user.name)
                    .join(', ');
                  const displayText = specialistNames 
                    ? `${specialty.name} - ${specialistNames}`
                    : specialty.name;
                  
                  return (
                    <SelectItem key={specialty.id} value={specialty.id}>
                      {displayText}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.specialtyId && (
              <p className="text-sm text-red-500">{errors.specialtyId}</p>
            )}
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
              {isLoading ? 'Cambiando...' : 'Cambiar Especialidad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
