'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PatientSearch } from '@/components/common/PatientSearch';
import { PatientModal } from '@/components/PatientModal';
import PatientAppointmentModal from '@/components/PatientAppointmentModal';
import { AppointmentModalProps, AppointmentStatus } from '@/types/appointments';
import { SpecialtyDatePicker } from '@/components/SpecialtyDatePicker';
import { Patient } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  onSave,
  specialties,
  isLoading = false
}: AppointmentModalProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    specialtyId: '',
    appointmentDate: '',
    appointmentTime: '',
    status: 'programado' as AppointmentStatus,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPatientAppointmentModal, setShowPatientAppointmentModal] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [selectedDateObj, setSelectedDateObj] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  // Cargar días disponibles cuando se selecciona especialidad
  useEffect(() => {
    const loadAvailableDays = async () => {
      if (formData.specialtyId) {
        try {
          const response = await fetch(`/api/specialties/${formData.specialtyId}/days`);
          if (response.ok) {
            const data = await response.json();
            const days = data.days?.map((d: { dayOfWeek: number }) => d.dayOfWeek) || [];
            setAvailableDays(days.length > 0 ? days : [0, 1, 2, 3, 4, 5, 6]); // Todos los días si no está configurado
          }
        } catch (error) {
          console.error('Error loading available days:', error);
          setAvailableDays([0, 1, 2, 3, 4, 5, 6]); // Default: todos los días
        }
      } else {
        setAvailableDays([]);
      }
    };
    loadAvailableDays();
  }, [formData.specialtyId]);

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        // Editar cita existente
        const appointmentDate = new Date(appointment.appointmentDate);
        setFormData({
          patientId: appointment.patientId,
          specialtyId: appointment.specialtyId,
          appointmentDate: appointmentDate.toISOString().split('T')[0],
          appointmentTime: appointmentDate.toTimeString().slice(0, 5),
          status: appointment.status,
          notes: appointment.notes || ''
        });
        setSelectedDateObj(appointmentDate);
      } else {
        // Nueva cita
        setFormData({
          patientId: '',
          specialtyId: '',
          appointmentDate: '',
          appointmentTime: '',
          status: 'programado',
          notes: ''
        });
        setSelectedDateObj(undefined);
      }
      setErrors({});
    }
  }, [isOpen, appointment]);


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = 'El paciente es requerido';
    }

    if (!formData.specialtyId) {
      newErrors.specialtyId = 'La especialidad es requerida';
    }

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

    if (!validateForm()) {
      return;
    }

    try {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      
      const data = {
        patientId: formData.patientId,
        specialtyId: formData.specialtyId,
        appointmentDate: appointmentDateTime,
        status: formData.status,
        notes: formData.notes.trim() || undefined
      };

      await onSave(data);
    } catch (error) {
      console.error('Error saving appointment:', error);
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

  const handleAddNewPatient = () => {
    setShowPatientAppointmentModal(true);
    onClose(); // Cerrar el modal de citas
  };

  const handlePatientAppointmentCreated = () => {
    // Cerrar el modal de paciente y cita
    setShowPatientAppointmentModal(false);
    
    // Recargar la página para mostrar la nueva cita
    window.location.reload();
  };

  // Nuevo handler para crear paciente desde PatientModal
  const handlePatientCreated = async (data: unknown) => {
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear paciente");

      const newPatient = await response.json();
      
      // Seleccionar automáticamente el nuevo paciente
      setFormData(prev => ({
        ...prev,
        patientId: newPatient.id
      }));
      
      // Cerrar el modal de paciente
      setIsPatientModalOpen(false);
      
      // Mostrar toast de éxito
      toast({
        title: "Paciente creado",
        description: "El paciente ha sido agregado exitosamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el paciente",
        variant: "error",
      });
      throw error; // Re-throw para que PatientModal maneje el error
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {appointment ? 'Editar Cita' : 'Nueva Cita'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {appointment 
              ? 'Modifica los detalles de la cita médica'
              : 'Crea una nueva cita médica para un paciente'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Paciente */}
            <div className="space-y-2">
              <PatientSearch
                value={formData.patientId}
                onChange={(value) => handleInputChange('patientId', value)}
                placeholder="Seleccionar paciente..."
                label="Paciente *"
                error={errors.patientId}
                onAddNewPatient={() => setIsPatientModalOpen(true)}
              />
            </div>

            {/* Especialidad */}
            <div className="space-y-2">
              <Label htmlFor="specialtyId" className="text-sm font-medium text-gray-700">Especialidad *</Label>
              <Select
                value={formData.specialtyId}
                onValueChange={(value) => handleInputChange('specialtyId', value)}
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
                    const specialists = specialty.users || [];
                    const specialistNames = specialists
                      .map(user => user.name)
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
              <SpecialtyDatePicker
                selectedDate={selectedDateObj}
                onDateSelect={(date) => {
                  setSelectedDateObj(date);
                  if (date) {
                    handleInputChange('appointmentDate', date.toISOString().split('T')[0]);
                  } else {
                    handleInputChange('appointmentDate', '');
                  }
                }}
                availableDays={availableDays}
                disabled={!formData.specialtyId}
                minDate={new Date()}
              />
              {errors.appointmentDate && (
                <p className="text-sm text-red-500">{errors.appointmentDate}</p>
              )}
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <Label htmlFor="appointmentTime" className="text-sm font-medium text-gray-700">Hora *</Label>
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


          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales sobre la cita..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
            />
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
              {isLoading ? 'Guardando...' : appointment ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Modal para crear nuevo paciente y cita */}
      <PatientAppointmentModal
        isOpen={showPatientAppointmentModal}
        onClose={() => setShowPatientAppointmentModal(false)}
        onSuccess={handlePatientAppointmentCreated}
        specialties={specialties.map(s => ({ id: s.id, name: s.name }))}
        isLoading={isLoading}
      />

      {/* Modal anidado para crear paciente */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patient={null}
        onSave={handlePatientCreated}
      />
    </Dialog>
  );
}
