'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineSpinner } from '@/components/ui/spinner';
import { medicalToasts } from "@/lib/toast";
import { PatientModalProps } from '@/types/patients';

export function PatientModal({ isOpen, onClose, patient, onSave }: PatientModalProps) {
  const isEditing = !!patient;
  
  const [formData, setFormData] = useState({
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
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Inicializar formulario
  useEffect(() => {
    if (isOpen) {
      if (patient) {
        const parts = patient.identityNumber.split('-');
        setFormData({
          firstName: patient.firstName,
          lastName: patient.lastName,
          birthDate: patient.birthDate.split('T')[0],
          gender: patient.gender,
          identityNumber: patient.identityNumber,
          phone: patient.phone || "",
          address: patient.address || "",
          emergencyContactName: patient.emergencyContactName || "",
          emergencyContactNumber: patient.emergencyContactNumber || "",
          emergencyContactRelation: patient.emergencyContactRelation || "",
          medicalHistory: patient.medicalHistory || "",
          allergies: patient.allergies || "",
        });
        setIdentityParts({
          part1: parts[0] || "",
          part2: parts[1] || "",
          part3: parts[2] || "",
        });
        
        // Configurar información de contacto de emergencia directamente desde los campos separados
        setEmergencyContactInfo({
          name: patient.emergencyContactName || "",
          phone: patient.emergencyContactNumber || "",
          relationship: patient.emergencyContactRelation || "",
        });
      } else {
        setFormData({
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
      }
      setErrors({});
    }
  }, [isOpen, patient]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!identityParts.part1 || !identityParts.part2 || !identityParts.part3) {
      newErrors.identityNumber = "El número de identidad es requerido";
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }

    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida";
    }

    if (!formData.gender) {
      newErrors.gender = "El sexo es requerido";
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
      setLoading(true);

      const url = isEditing ? `/api/patients/${patient.id}` : "/api/patients";
      const method = isEditing ? "PUT" : "POST";

      // Construir número de identidad completo
      const fullIdentityNumber = `${identityParts.part1}-${identityParts.part2}-${identityParts.part3}`;
      
      // Los campos de contacto de emergencia ya están separados, no necesitamos combinar

      const body = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthDate: formData.birthDate,
        gender: formData.gender,
        identityNumber: fullIdentityNumber,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        emergencyContactName: emergencyContactInfo.name.trim() || null,
        emergencyContactNumber: emergencyContactInfo.phone.trim() || null,
        emergencyContactRelation: emergencyContactInfo.relationship.trim() || null,
        medicalHistory: formData.medicalHistory.trim() || null,
        allergies: formData.allergies.trim() || null,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const savedPatient = await response.json();
        // Mostrar toast de éxito
        if (isEditing) {
          medicalToasts.patientUpdated(`${formData.firstName} ${formData.lastName}`);
        } else {
          medicalToasts.patientCreated(`${formData.firstName} ${formData.lastName}`);
        }
        onSave(savedPatient);
        onClose();
      } else {
        const errorData = await response.json();
        if (errorData.error && errorData.error.includes("número de identidad")) {
          setErrors({ identityNumber: errorData.error });
          medicalToasts.duplicateError("número de identidad");
        } else {
          setErrors({ general: errorData.error || 'Error al guardar el paciente' });
          medicalToasts.patientError(isEditing ? 'actualizar' : 'crear');
        }
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      setErrors({ general: 'Error al guardar el paciente' });
      medicalToasts.networkError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Paciente" : "Registrar Nuevo Paciente"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {errors.general}
            </div>
          )}

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
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
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
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
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
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                  className={errors.birthDate ? "border-red-500" : ""}
                />
                {errors.birthDate && (
                  <p className="text-red-600 text-sm">{errors.birthDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Sexo *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange("gender", value)}
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
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
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
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
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
                  value={formData.medicalHistory}
                  onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
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
                  value={formData.allergies}
                  onChange={(e) => handleInputChange("allergies", e.target.value)}
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
                  <Label htmlFor="emergencyRelationship">Parentesco</Label>
                  <Select
                    value={emergencyContactInfo.relationship}
                    onValueChange={(value) => setEmergencyContactInfo(prev => ({
                      ...prev,
                      relationship: value
                    }))}
                  >
                    <SelectTrigger className={errors.emergencyContact ? "border-red-500" : ""}>
                      <SelectValue placeholder="Seleccionar parentesco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Madre">👩‍👧‍👦 Madre</SelectItem>
                      <SelectItem value="Padre">👨‍👧‍👦 Padre</SelectItem>
                      <SelectItem value="Hermano/a">👫 Hermano/a</SelectItem>
                      <SelectItem value="Cónyuge">💑 Cónyuge</SelectItem>
                      <SelectItem value="Novio/a">💕 Novio/a</SelectItem>
                      <SelectItem value="Hijo/a">👶 Hijo/a</SelectItem>
                      <SelectItem value="Abuelo/a">👴👵 Abuelo/a</SelectItem>
                      <SelectItem value="Tío/a">👨‍👩‍👧‍👦 Tío/a</SelectItem>
                      <SelectItem value="Primo/a">👨‍👩‍👧‍👦 Primo/a</SelectItem>
                      <SelectItem value="Amigo/a">🤝 Amigo/a</SelectItem>
                      <SelectItem value="Otro">👤 Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {(errors.emergencyContactName || errors.emergencyContactNumber || errors.emergencyContactRelation) && (
                <p className="text-red-600 text-sm">Debe completar todos los campos del contacto de emergencia</p>
              )}
            </div>
            </div>
          </form>

        <DialogFooter className="pt-6">
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
            disabled={loading}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <InlineSpinner size="sm" />
                <span className="ml-2">Guardando...</span>
              </>
            ) : (
              <span>{isEditing ? 'Actualizar Paciente' : 'Registrar Paciente'}</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}