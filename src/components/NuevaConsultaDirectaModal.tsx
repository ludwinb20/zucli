'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientSearch } from '@/components/common/PatientSearch';
import { PatientModal } from '@/components/PatientModal';
import { Specialty } from '@/types/appointments';
import { PreclinicaData } from '@/types/components';
import { CreatePatientData, UpdatePatientData, Patient } from '@/types/patients';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { InlineSpinner } from '@/components/ui/spinner';
import { useRouter } from 'next/navigation';

interface NuevaConsultaDirectaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NuevaConsultaDirectaModal({
  isOpen,
  onClose,
}: NuevaConsultaDirectaModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    patientId: '',
    specialtyId: user?.role?.name === 'especialista' ? user.specialty?.id || '' : '',
    preclinica: {
      presionArterial: '',
      temperatura: '',
      fc: '',
      fr: '',
      satO2: '',
      peso: '',
      talla: '',
      examenFisico: '',
      idc: '',
      tx: ''
    } as PreclinicaData
  });

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Cargar especialidades
  useEffect(() => {
    if (isOpen) {
      const loadSpecialties = async () => {
        try {
          setLoadingSpecialties(true);
          const response = await fetch('/api/specialties');
          if (response.ok) {
            const data = await response.json();
            setSpecialties(data.specialties || []);
          }
        } catch (error) {
          console.error('Error loading specialties:', error);
        } finally {
          setLoadingSpecialties(false);
        }
      };

      loadSpecialties();

      // Si el usuario es especialista, usar su especialidad por defecto
      if (user?.role?.name === 'especialista' && user.specialty?.id) {
        setFormData(prev => ({
          ...prev,
          specialtyId: user.specialty!.id
        }));
      }
    }
  }, [isOpen, user]);

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        patientId: '',
        specialtyId: user?.role?.name === 'especialista' ? user.specialty?.id || '' : '',
        preclinica: {
          presionArterial: '',
          temperatura: '',
          fc: '',
          fr: '',
          satO2: '',
          peso: '',
          talla: '',
          examenFisico: '',
          idc: '',
          tx: ''
        }
      });
      setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = 'El paciente es requerido';
    }

    if (!formData.specialtyId) {
      newErrors.specialtyId = 'La especialidad es requerida';
    }

    // Validar preclínica (campos requeridos)
    if (!formData.preclinica.presionArterial.trim()) {
      newErrors['preclinica.presionArterial'] = 'La presión arterial es requerida';
    }

    if (!formData.preclinica.temperatura.trim()) {
      newErrors['preclinica.temperatura'] = 'La temperatura es requerida';
    }

    if (!formData.preclinica.fc.trim()) {
      newErrors['preclinica.fc'] = 'La frecuencia cardíaca es requerida';
    }

    if (!formData.preclinica.fr.trim()) {
      newErrors['preclinica.fr'] = 'La frecuencia respiratoria es requerida';
    }

    if (!formData.preclinica.satO2.trim()) {
      newErrors['preclinica.satO2'] = 'La saturación de oxígeno es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "error",
      });
      return;
    }

    try {
      setLoading(true);

      // 1. Crear la cita para hoy mismo en estado "pendiente"
      // Usar la hora actual más 5 minutos para evitar problemas de sincronización
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);

      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          specialtyId: formData.specialtyId,
          appointmentDate: now.toISOString(),
          status: 'pendiente',
          notes: 'Consulta directa creada desde modal'
        }),
      });

      if (!appointmentResponse.ok) {
        const errorData = await appointmentResponse.json();
        throw new Error(errorData.error || 'Error al crear la cita');
      }

      const appointment = await appointmentResponse.json();

      // 2. Crear la preclínica asociada a la cita
      const preclinicaResponse = await fetch('/api/preclinicas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId: appointment.id,
          presionArterial: formData.preclinica.presionArterial.trim(),
          temperatura: formData.preclinica.temperatura.trim(),
          fc: formData.preclinica.fc.trim(),
          fr: formData.preclinica.fr.trim(),
          satO2: formData.preclinica.satO2.trim(),
          peso: formData.preclinica.peso.trim() || null,
          talla: formData.preclinica.talla.trim() || null,
          examenFisico: formData.preclinica.examenFisico.trim() || null,
          idc: formData.preclinica.idc.trim() || null,
          tx: formData.preclinica.tx.trim() || null,
        }),
      });

      if (!preclinicaResponse.ok) {
        const errorData = await preclinicaResponse.json();
        throw new Error(errorData.error || 'Error al crear la preclínica');
      }

      toast({
        title: "Éxito",
        description: "Cita y preclínica creadas exitosamente",
        variant: "success",
      });

      // 3. Navegar a la página de consulta
      router.push(`/consulta-externa/${appointment.id}`);
      onClose();

    } catch (error) {
      console.error('Error creating direct consultation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al crear la consulta directa',
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreclinicaChange = (field: keyof PreclinicaData, value: string) => {
    setFormData(prev => ({
      ...prev,
      preclinica: {
        ...prev.preclinica,
        [field]: value
      }
    }));

    // Limpiar error del campo
    const errorKey = `preclinica.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const handlePatientCreated = async (data: CreatePatientData | UpdatePatientData) => {
    try {
      // PatientModal realmente pasa el Patient completo con id después de crearlo
      // pero el tipo de la prop dice CreatePatientData | UpdatePatientData
      // Usamos type assertion porque sabemos que PatientModal pasa el Patient completo
      const patient = data as unknown as Patient;
      
      // Verificar si tiene id (es un Patient completo)
      const patientId = patient?.id || '';
      
      if (!patientId) {
        throw new Error("No se pudo obtener el ID del paciente");
      }
      
      setFormData(prev => ({
        ...prev,
        patientId
      }));
      setIsPatientModalOpen(false);
      toast({
        title: "Éxito",
        description: "Paciente creado exitosamente",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el paciente",
        variant: "error",
      });
      throw error;
    }
  };

  const filteredSpecialties = user?.role?.name === 'especialista' && user.specialty
    ? specialties.filter(s => s.id === user.specialty!.id)
    : specialties.filter(s => s.isActive);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Nueva Consulta Directa
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Crea una cita para hoy mismo, marca como pendiente y completa la preclínica
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de Paciente */}
            <div className="space-y-2">
              <PatientSearch
                value={formData.patientId}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, patientId: value }));
                  if (errors.patientId) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.patientId;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Buscar paciente..."
                label="Paciente *"
                error={errors.patientId}
                onAddNewPatient={() => setIsPatientModalOpen(true)}
              />
            </div>

            {/* Selección de Especialidad */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Especialidad *
              </Label>
              <Select
                value={formData.specialtyId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, specialtyId: value }));
                  if (errors.specialtyId) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.specialtyId;
                      return newErrors;
                    });
                  }
                }}
                disabled={user?.role?.name === 'especialista' || loadingSpecialties}
              >
                <SelectTrigger className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.specialtyId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder={loadingSpecialties ? "Cargando..." : "Seleccionar especialidad..."} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSpecialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.specialtyId && (
                <p className="text-sm text-red-500">{errors.specialtyId}</p>
              )}
              {user?.role?.name === 'especialista' && (
                <p className="text-xs text-gray-500">
                  Especialidad fijada: {user.specialty?.name}
                </p>
              )}
            </div>

            {/* Preclínica */}
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Preclínica
              </h3>
              
              {/* Signos Vitales */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
                  Signos Vitales
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="presionArterial" className="text-sm font-medium text-gray-700">
                      Presión Arterial *
                    </Label>
                    <Input
                      id="presionArterial"
                      value={formData.preclinica.presionArterial}
                      onChange={(e) => handlePreclinicaChange('presionArterial', e.target.value)}
                      placeholder="120/80"
                      className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors['preclinica.presionArterial'] ? 'border-red-500' : ''}`}
                    />
                    {errors['preclinica.presionArterial'] && (
                      <p className="text-sm text-red-500">{errors['preclinica.presionArterial']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperatura" className="text-sm font-medium text-gray-700">
                      Temperatura (°C) *
                    </Label>
                    <Input
                      id="temperatura"
                      type="number"
                      step="0.1"
                      value={formData.preclinica.temperatura}
                      onChange={(e) => handlePreclinicaChange('temperatura', e.target.value)}
                      placeholder="36.5"
                      className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors['preclinica.temperatura'] ? 'border-red-500' : ''}`}
                    />
                    {errors['preclinica.temperatura'] && (
                      <p className="text-sm text-red-500">{errors['preclinica.temperatura']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fc" className="text-sm font-medium text-gray-700">
                      FC (lpm) *
                    </Label>
                    <Input
                      id="fc"
                      type="number"
                      value={formData.preclinica.fc}
                      onChange={(e) => handlePreclinicaChange('fc', e.target.value)}
                      placeholder="72"
                      className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors['preclinica.fc'] ? 'border-red-500' : ''}`}
                    />
                    {errors['preclinica.fc'] && (
                      <p className="text-sm text-red-500">{errors['preclinica.fc']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fr" className="text-sm font-medium text-gray-700">
                      FR (rpm) *
                    </Label>
                    <Input
                      id="fr"
                      type="number"
                      value={formData.preclinica.fr}
                      onChange={(e) => handlePreclinicaChange('fr', e.target.value)}
                      placeholder="16"
                      className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors['preclinica.fr'] ? 'border-red-500' : ''}`}
                    />
                    {errors['preclinica.fr'] && (
                      <p className="text-sm text-red-500">{errors['preclinica.fr']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="satO2" className="text-sm font-medium text-gray-700">
                      Sat O₂ (%) *
                    </Label>
                    <Input
                      id="satO2"
                      type="number"
                      value={formData.preclinica.satO2}
                      onChange={(e) => handlePreclinicaChange('satO2', e.target.value)}
                      placeholder="98"
                      className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors['preclinica.satO2'] ? 'border-red-500' : ''}`}
                    />
                    {errors['preclinica.satO2'] && (
                      <p className="text-sm text-red-500">{errors['preclinica.satO2']}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="peso" className="text-sm font-medium text-gray-700">
                      Peso (lbs)
                    </Label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.1"
                      value={formData.preclinica.peso}
                      onChange={(e) => handlePreclinicaChange('peso', e.target.value)}
                      placeholder="150.0"
                      className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="talla" className="text-sm font-medium text-gray-700">
                      Talla (cm)
                    </Label>
                    <Input
                      id="talla"
                      type="number"
                      step="0.1"
                      value={formData.preclinica.talla}
                      onChange={(e) => handlePreclinicaChange('talla', e.target.value)}
                      placeholder="170.0"
                      className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                    />
                  </div>
                </div>
              </div>

              {/* Evaluación Médica */}
              <div className="space-y-4 mt-6">
                <h4 className="text-sm font-medium text-gray-700 border-b border-gray-100 pb-2">
                  Evaluación Médica
                </h4>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="examenFisico" className="text-sm font-medium text-gray-700">
                      Examen Físico
                    </Label>
                    <Textarea
                      id="examenFisico"
                      value={formData.preclinica.examenFisico}
                      onChange={(e) => handlePreclinicaChange('examenFisico', e.target.value)}
                      placeholder="Descripción del examen físico general..."
                      rows={3}
                      className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idc" className="text-sm font-medium text-gray-700">
                      IDC (Impresión Diagnóstica Clínica)
                    </Label>
                    <Textarea
                      id="idc"
                      value={formData.preclinica.idc}
                      onChange={(e) => handlePreclinicaChange('idc', e.target.value)}
                      placeholder="Impresión diagnóstica inicial..."
                      rows={3}
                      className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tx" className="text-sm font-medium text-gray-700">
                      TX (Tratamiento)
                    </Label>
                    <Textarea
                      id="tx"
                      value={formData.preclinica.tx}
                      onChange={(e) => handlePreclinicaChange('tx', e.target.value)}
                      placeholder="Tratamiento indicado..."
                      rows={3}
                      className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                {loading ? (
                  <>
                    <InlineSpinner className="mr-2" />
                    Creando...
                  </>
                ) : (
                  'Crear Cita y Preclínica'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal para crear nuevo paciente */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handlePatientCreated}
      />
    </>
  );
}

