'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AppointmentStatus } from '@/types/appointments';
import { PatientAppointmentModalProps } from '@/types/components';

export default function PatientAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  specialties,
  isLoading = false
}: PatientAppointmentModalProps) {
  const [patientData, setPatientData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "",
    identityNumber: "",
    phone: "",
    address: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    emergencyContactRelation: "",
    medicalHistory: "",
    allergies: "",
  });

  // Estados para campos separados del número de identidad
  const [identityParts, setIdentityParts] = useState({
    part1: "",
    part2: "",
    part3: "",
  });
  
  // Estados para campos separados del contacto de emergencia
  const [emergencyContactInfo, setEmergencyContactInfo] = useState({
    name: "",
    phone: "",
    relationship: "",
  });

  const [appointmentData, setAppointmentData] = useState({
    specialtyId: "",
    appointmentDate: "",
    appointmentTime: "",
    status: 'programado' as AppointmentStatus,
    notes: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState<'patient' | 'appointment'>('patient');

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPatientData({
        firstName: "",
        lastName: "",
        birthDate: "",
        gender: "",
        identityNumber: "",
        phone: "",
        address: "",
        emergencyContactName: "",
        emergencyContactNumber: "",
        emergencyContactRelation: "",
        medicalHistory: "",
        allergies: "",
      });
      setIdentityParts({
        part1: "",
        part2: "",
        part3: "",
      });
      setEmergencyContactInfo({
        name: "",
        phone: "",
        relationship: "",
      });
      setAppointmentData({
        specialtyId: "",
        appointmentDate: "",
        appointmentTime: "",
        status: 'programado',
        notes: ""
      });
      setErrors({});
      setCurrentStep('patient');
    }
  }, [isOpen]);

  const validatePatientData = () => {
    const newErrors: Record<string, string> = {};

    if (!identityParts.part1 || !identityParts.part2 || !identityParts.part3) {
      newErrors.identityNumber = "El número de identidad es requerido";
    }
    
    if (!patientData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }

    if (!patientData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }

    if (!patientData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida";
    }

    if (!patientData.gender) {
      newErrors.gender = "El sexo es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAppointmentData = () => {
    const newErrors: Record<string, string> = {};

    if (!appointmentData.specialtyId) {
      newErrors.specialtyId = 'La especialidad es requerida';
    }

    if (!appointmentData.appointmentDate) {
      newErrors.appointmentDate = 'La fecha es requerida';
    }

    if (!appointmentData.appointmentTime) {
      newErrors.appointmentTime = 'La hora es requerida';
    }

    // Validar que la fecha no sea en el pasado
    if (appointmentData.appointmentDate && appointmentData.appointmentTime) {
      const appointmentDateTime = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}`);
      const now = new Date();
      
      if (appointmentDateTime < now) {
        newErrors.appointmentDate = 'La fecha y hora no pueden ser en el pasado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePatientInputChange = (field: string, value: string) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAppointmentInputChange = (field: string, value: string) => {
    setAppointmentData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNext = () => {
    if (validatePatientData()) {
      setCurrentStep('appointment');
    }
  };

  const handleBack = () => {
    setCurrentStep('patient');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAppointmentData()) {
      return;
    }

    try {
      // Primero crear el paciente
      // Construir número de identidad completo
      const fullIdentityNumber = `${identityParts.part1}-${identityParts.part2}-${identityParts.part3}`;
      
      const patientPayload = {
        firstName: patientData.firstName.trim(),
        lastName: patientData.lastName.trim(),
        birthDate: patientData.birthDate,
        gender: patientData.gender,
        identityNumber: fullIdentityNumber,
        phone: patientData.phone.trim() || null,
        address: patientData.address.trim() || null,
        emergencyContactName: emergencyContactInfo.name.trim() || null,
        emergencyContactNumber: emergencyContactInfo.phone.trim() || null,
        emergencyContactRelation: emergencyContactInfo.relationship.trim() || null,
        medicalHistory: patientData.medicalHistory.trim() || null,
        allergies: patientData.allergies.trim() || null,
      };

      const patientResponse = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientPayload),
      });

      if (!patientResponse.ok) {
        throw new Error('Error creating patient');
      }

      const newPatient = await patientResponse.json();

      // Luego crear la cita
      const appointmentDateTime = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}`);
      
      const appointmentPayload = {
        patientId: newPatient.id,
        specialtyId: appointmentData.specialtyId,
        appointmentDate: appointmentDateTime,
        status: appointmentData.status,
        notes: appointmentData.notes.trim() || undefined
      };

      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentPayload),
      });

      if (!appointmentResponse.ok) {
        throw new Error('Error creating appointment');
      }

      const newAppointment = await appointmentResponse.json();
      onSuccess(newPatient.id, newAppointment);
    } catch (error) {
      console.error('Error creating patient and appointment:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Nuevo Paciente y Cita
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Indicador de pasos */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${currentStep === 'patient' ? 'text-[#2E9589]' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'patient' ? 'bg-[#2E9589] text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <span className="text-sm font-medium">Información del Paciente</span>
            </div>
            <div className="flex-1 h-px bg-gray-300"></div>
            <div className={`flex items-center space-x-2 ${currentStep === 'appointment' ? 'text-[#2E9589]' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep === 'appointment' ? 'bg-[#2E9589] text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <span className="text-sm font-medium">Información de la Cita</span>
            </div>
          </div>

          {currentStep === 'patient' ? (
            <div className="space-y-6">
              {/* SECCIÓN 1: DATOS OBLIGATORIOS */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">OBLIGATORIO</span>
                    Datos Esenciales
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Información mínima requerida para el registro</p>
                </div>

                {/* Primera fila: Número de identidad */}
                <div className="space-y-2">
                  <Label htmlFor="identityNumber">Número de Identidad *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="identityPart1"
                      value={identityParts.part1}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setIdentityParts(prev => ({ ...prev, part1: value }));
                        if (errors.identityNumber) {
                          setErrors(prev => ({ ...prev, identityNumber: '' }));
                        }
                      }}
                      placeholder="0801"
                      className={`w-20 text-center ${errors.identityNumber ? "border-red-500" : ""}`}
                      maxLength={4}
                    />
                    <span className="text-gray-500 font-medium">-</span>
                    <Input
                      id="identityPart2"
                      value={identityParts.part2}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setIdentityParts(prev => ({ ...prev, part2: value }));
                        if (errors.identityNumber) {
                          setErrors(prev => ({ ...prev, identityNumber: '' }));
                        }
                      }}
                      placeholder="1990"
                      className={`w-20 text-center ${errors.identityNumber ? "border-red-500" : ""}`}
                      maxLength={4}
                    />
                    <span className="text-gray-500 font-medium">-</span>
                    <Input
                      id="identityPart3"
                      value={identityParts.part3}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                        setIdentityParts(prev => ({ ...prev, part3: value }));
                        if (errors.identityNumber) {
                          setErrors(prev => ({ ...prev, identityNumber: '' }));
                        }
                      }}
                      placeholder="12345"
                      className={`w-24 text-center ${errors.identityNumber ? "border-red-500" : ""}`}
                      maxLength={5}
                    />
                  </div>
                  {errors.identityNumber && (
                    <p className="text-red-600 text-sm">{errors.identityNumber}</p>
                  )}
                  <p className="text-xs text-gray-500">Formato: XXXX-XXXX-XXXXX</p>
                </div>

                {/* Segunda fila: Nombre y Apellido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={patientData.firstName}
                      onChange={(e) => handlePatientInputChange("firstName", e.target.value)}
                      placeholder="Ej: Juan, María, Carlos"
                      className={errors.firstName ? "border-red-500" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-red-600 text-sm">{errors.firstName}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={patientData.lastName}
                      onChange={(e) => handlePatientInputChange("lastName", e.target.value)}
                      placeholder="Ej: Pérez, García, López"
                      className={errors.lastName ? "border-red-500" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-red-600 text-sm">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Tercera fila: Fecha de nacimiento y Sexo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={patientData.birthDate}
                      onChange={(e) => handlePatientInputChange("birthDate", e.target.value)}
                      className={errors.birthDate ? "border-red-500" : ""}
                    />
                    {errors.birthDate && (
                      <p className="text-red-600 text-sm">{errors.birthDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Sexo *</Label>
                    <Select
                      value={patientData.gender}
                      onValueChange={(value) => handlePatientInputChange("gender", value)}
                    >
                      <SelectTrigger className={errors.gender ? "border-red-500" : ""}>
                        <SelectValue placeholder="Seleccione el sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-red-600 text-sm">{errors.gender}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: DATOS OPCIONALES */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2">OPCIONAL</span>
                    Información Adicional
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Datos complementarios que pueden completarse después</p>
                </div>

                {/* Primera fila: Teléfono y Dirección */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={patientData.phone}
                      onChange={(e) => handlePatientInputChange("phone", e.target.value)}
                      placeholder="Ej: 9876-5432, +504 9876-5432"
                      className={errors.phone ? "border-red-500" : ""}
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-sm">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      value={patientData.address}
                      onChange={(e) => handlePatientInputChange("address", e.target.value)}
                      placeholder="Ej: Col. Centro, Tegucigalpa, Honduras"
                      className={errors.address ? "border-red-500" : ""}
                    />
                    {errors.address && (
                      <p className="text-red-600 text-sm">{errors.address}</p>
                    )}
                  </div>
                </div>

                {/* Segunda fila: Enfermedades base y Alergias */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="medicalHistory">Enfermedades Base</Label>
                    <Input
                      id="medicalHistory"
                      value={patientData.medicalHistory}
                      onChange={(e) => handlePatientInputChange("medicalHistory", e.target.value)}
                      placeholder="Ej: Diabetes tipo 2, Hipertensión arterial"
                      className={errors.medicalHistory ? "border-red-500" : ""}
                    />
                    {errors.medicalHistory && (
                      <p className="text-red-600 text-sm">{errors.medicalHistory}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Alergias</Label>
                    <Input
                      id="allergies"
                      value={patientData.allergies}
                      onChange={(e) => handlePatientInputChange("allergies", e.target.value)}
                      placeholder="Ej: Penicilina, Mariscos, Polen"
                      className={errors.allergies ? "border-red-500" : ""}
                    />
                    {errors.allergies && (
                      <p className="text-red-600 text-sm">{errors.allergies}</p>
                    )}
                  </div>
                </div>

                {/* Tercera fila: Contacto de emergencia */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Contacto de Emergencia</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyName">Nombre Completo</Label>
                      <Input
                        id="emergencyName"
                        value={emergencyContactInfo.name}
                        onChange={(e) => setEmergencyContactInfo(prev => ({
                          ...prev,
                          name: e.target.value
                        }))}
                        placeholder="Ej: María García"
                        className={errors.emergencyContactName ? "border-red-500" : ""}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Número de Teléfono</Label>
                      <Input
                        id="emergencyPhone"
                        value={emergencyContactInfo.phone}
                        onChange={(e) => setEmergencyContactInfo(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                        placeholder="Ej: 9876-5432"
                        className={errors.emergencyContactName ? "border-red-500" : ""}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="emergencyRelationship">Relación</Label>
                      <Input
                        id="emergencyRelationship"
                        value={emergencyContactInfo.relationship}
                        onChange={(e) => setEmergencyContactInfo(prev => ({
                          ...prev,
                          relationship: e.target.value
                        }))}
                        placeholder="Ej: Padre, Madre, Esposo"
                        className={errors.emergencyContactName ? "border-red-500" : ""}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información de la Cita</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="specialtyId" className="text-sm font-medium text-gray-700">Especialidad *</Label>
                  <Select
                    value={appointmentData.specialtyId}
                    onValueChange={(value) => handleAppointmentInputChange('specialtyId', value)}
                  >
                    <SelectTrigger className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.specialtyId ? 'border-red-500' : ''}`}>
                      <SelectValue placeholder="Seleccionar especialidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.specialtyId && (
                    <p className="text-sm text-red-500">{errors.specialtyId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentDate" className="text-sm font-medium text-gray-700">Fecha *</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={appointmentData.appointmentDate}
                    onChange={(e) => handleAppointmentInputChange('appointmentDate', e.target.value)}
                    className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.appointmentDate ? 'border-red-500' : ''}`}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.appointmentDate && (
                    <p className="text-sm text-red-500">{errors.appointmentDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentTime" className="text-sm font-medium text-gray-700">Hora *</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={appointmentData.appointmentTime}
                    onChange={(e) => handleAppointmentInputChange('appointmentTime', e.target.value)}
                    className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.appointmentTime ? 'border-red-500' : ''}`}
                  />
                  {errors.appointmentTime && (
                    <p className="text-sm text-red-500">{errors.appointmentTime}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Observaciones adicionales sobre la cita..."
                  value={appointmentData.notes}
                  onChange={(e) => handleAppointmentInputChange('notes', e.target.value)}
                  rows={3}
                  className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {currentStep === 'patient' ? (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleNext}
                  className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                  Siguiente
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Anterior
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                  {isLoading ? 'Guardando...' : 'Crear Paciente y Cita'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
