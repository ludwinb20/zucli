'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { CalendarIcon, UserPlus, X, ChevronDownIcon } from 'lucide-react';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: any) => void;
}

export function PatientModal({ isOpen, onClose, onSave }: PatientModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    birthDate: '',
    identityNumber: '',
    gender: '',
    phone: '',
    email: '',
    address: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'El apellido es requerido';
    if (!formData.birthDate) newErrors.birthDate = 'La fecha de nacimiento es requerida';
    if (!formData.identityNumber.trim()) newErrors.identityNumber = 'El número de identidad es requerido';
    if (!formData.gender) newErrors.gender = 'El sexo es requerido';

    // Validar formato de identidad (formato hondureño)
    const identityRegex = /^\d{4}-\d{4}-\d{5}$/;
    if (formData.identityNumber && !identityRegex.test(formData.identityNumber)) {
      newErrors.identityNumber = 'Formato: 1234-5678-90123';
    }

    // Validar email si se proporciona
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      setFormData({
        name: '',
        lastName: '',
        birthDate: '',
        identityNumber: '',
        gender: '',
        phone: '',
        email: '',
        address: ''
      });
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      lastName: '',
      birthDate: '',
      identityNumber: '',
      gender: '',
      phone: '',
      email: '',
      address: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="flex items-center p-6 pb-4 text-lg font-semibold">
            <UserPlus className="h-5 w-5 mr-2 text-[#2E9589]" />
            Nuevo Paciente
          </Dialog.Title>
          <Dialog.Description className="px-6 pb-4 text-gray-600">
            Complete la información básica del paciente
            <p className="text-sm text-gray-500 mt-2">Los campos marcados con (*) son obligatorios</p>
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="Nombre del paciente"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={errors.lastName ? 'border-red-500' : ''}
                  placeholder="Apellido del paciente"
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="identityNumber">Número de Identidad *</Label>
                <Input
                  id="identityNumber"
                  value={formData.identityNumber}
                  onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                  className={errors.identityNumber ? 'border-red-500' : ''}
                  placeholder="1234-5678-90123"
                  maxLength={14}
                />
                {errors.identityNumber && <p className="text-red-500 text-sm mt-1">{errors.identityNumber}</p>}
              </div>
              <div>
                <Label htmlFor="gender">Sexo *</Label>
                <Select.Root value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <Select.Trigger className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.gender ? 'border-red-500' : ''}`}>
                    <Select.Value placeholder="Seleccionar sexo" />
                    <Select.Icon asChild>
                      <ChevronDownIcon className="h-4 w-4 opacity-50" />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                      <Select.Viewport className="p-1">
                        <Select.Item value="Masculino" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                          <Select.ItemText>Masculino</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="Femenino" className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                          <Select.ItemText>Femenino</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className={errors.birthDate ? 'border-red-500' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className=""
                  placeholder="9876-5432"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="email@ejemplo.com"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Dirección completa del paciente"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white">
                Guardar Paciente
              </Button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
