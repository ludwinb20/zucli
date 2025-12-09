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
    doctorId: '',
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
  const [specialtyDoctors, setSpecialtyDoctors] = useState<Array<{ id: string; name: string }>>([]);
  const { toast } = useToast();

  // Cargar días disponibles y doctores cuando se selecciona especialidad
  useEffect(() => {
    const loadSpecialtyData = async () => {
      if (formData.specialtyId) {
        try {
          // Cargar días disponibles
          const daysResponse = await fetch(`/api/specialties/${formData.specialtyId}/days`);
          if (daysResponse.ok) {
            const daysData = await daysResponse.json();
            const days = daysData.days?.map((d: { dayOfWeek: number }) => d.dayOfWeek) || [];
            setAvailableDays(days.length > 0 ? days : [0, 1, 2, 3, 4, 5, 6]);
          }

          // Cargar doctores de la especialidad
          const specialtyResponse = await fetch(`/api/specialties/${formData.specialtyId}`);
          if (specialtyResponse.ok) {
            const specialtyData = await specialtyResponse.json();
            // El endpoint devuelve { specialty: { users: [...] } }
            const doctors = Array.isArray(specialtyData.specialty?.users) 
              ? specialtyData.specialty.users 
              : [];
            
            console.log('Doctores cargados para especialidad:', doctors);
            setSpecialtyDoctors(doctors);

            // Si hay solo un doctor, asignarlo automáticamente
            if (doctors.length === 1) {
              setFormData(prev => ({
                ...prev,
                doctorId: doctors[0].id
              }));
            } else if (doctors.length > 1) {
              // Si hay varios doctores, verificar si el doctorId actual es válido
              setFormData(prev => {
                const currentDoctorId = prev.doctorId;
                const isValidDoctor = doctors.some((d: { id: string; name: string }) => d.id === currentDoctorId);
                // Solo limpiar si el doctorId actual no es válido para esta especialidad
                return {
                  ...prev,
                  doctorId: isValidDoctor ? currentDoctorId : ''
                };
              });
            } else {
              // Si no hay doctores, limpiar doctorId
              setFormData(prev => ({
                ...prev,
                doctorId: ''
              }));
            }
          }
        } catch (error) {
          console.error('Error loading specialty data:', error);
          setAvailableDays([0, 1, 2, 3, 4, 5, 6]);
          setSpecialtyDoctors([]);
        }
      } else {
        setAvailableDays([]);
        setSpecialtyDoctors([]);
        setFormData(prev => ({ ...prev, doctorId: '' }));
      }
    };
    loadSpecialtyData();
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
          doctorId: appointment.doctorId || '',
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
          doctorId: '',
          appointmentDate: '',
          appointmentTime: '',
          status: 'programado',
          notes: ''
        });
        setSelectedDateObj(undefined);
      }
      setErrors({});
      setSpecialtyDoctors([]);
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

    // Validar doctor si hay varios disponibles
    if (specialtyDoctors.length > 1 && !formData.doctorId) {
      newErrors.doctorId = 'Debe seleccionar un doctor';
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
        doctorId: formData.doctorId || null,
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
          </div>

          {/* Select de Doctor - Solo si hay más de un doctor disponible */}
          {specialtyDoctors.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="doctorId" className="text-sm font-medium text-gray-700">Doctor *</Label>
              <Select
                value={formData.doctorId}
                onValueChange={(value) => handleInputChange('doctorId', value)}
              >
                <SelectTrigger className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.doctorId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Seleccionar doctor" />
                </SelectTrigger>
                <SelectContent>
                  {specialtyDoctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.doctorId && (
                <p className="text-sm text-red-500">{errors.doctorId}</p>
              )}
            </div>
          )}

          {/* Mensaje informativo si hay solo un doctor o ninguno */}
          {formData.specialtyId && specialtyDoctors.length === 1 && (
            <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
              Doctor asignado automáticamente: {specialtyDoctors[0].name}
            </div>
          )}
          {formData.specialtyId && specialtyDoctors.length === 0 && (
            <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200">
              Esta especialidad no tiene doctores registrados. La cita se creará sin asignar un doctor.
            </div>
          )}

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
