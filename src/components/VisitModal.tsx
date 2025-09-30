'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as Dialog from '@radix-ui/react-dialog';
import { Stethoscope, Heart, Thermometer, Weight, Ruler, X } from 'lucide-react';

interface Visit {
  id: string;
  date: string;
  diagnosis: string;
  currentIllness: string;
  vitalSigns: {
    bloodPressure: string;
    heartRate: string;
    temperature: string;
    weight: string;
    height: string;
  };
}

interface Patient {
  id: string;
  name: string;
  lastName: string;
}

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visit: Omit<Visit, 'id'>) => void;
  patient: Patient | null;
}

export function VisitModal({ isOpen, onClose, onSave, patient }: VisitModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    currentIllness: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: ''
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.diagnosis.trim()) newErrors.diagnosis = 'El diagnóstico es requerido';
    if (!formData.currentIllness.trim()) newErrors.currentIllness = 'La enfermedad actual es requerida';
    if (!formData.vitalSigns.bloodPressure.trim()) newErrors.bloodPressure = 'La presión arterial es requerida';
    if (!formData.vitalSigns.heartRate.trim()) newErrors.heartRate = 'La frecuencia cardíaca es requerida';
    if (!formData.vitalSigns.temperature.trim()) newErrors.temperature = 'La temperatura es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        currentIllness: '',
        vitalSigns: {
          bloodPressure: '',
          heartRate: '',
          temperature: '',
          weight: '',
          height: ''
        }
      });
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      currentIllness: '',
      vitalSigns: {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        weight: '',
        height: ''
      }
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="flex items-center p-6 pb-4 text-lg font-semibold">
            <Stethoscope className="h-5 w-5 mr-2 text-[#2E9589]" />
            Nueva Visita Médica
          </Dialog.Title>
          <Dialog.Description className="px-6 pb-4 text-gray-600">
            {patient ? `Registrar visita para ${patient.name} ${patient.lastName}` : 'Registrar nueva visita'}
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
            {/* Información de la Visita */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información de la Visita</h3>
              
              <div>
                <Label htmlFor="date">Fecha de la Visita</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <Label htmlFor="diagnosis">Diagnóstico *</Label>
                <Input
                  id="diagnosis"
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  className={errors.diagnosis ? 'border-red-500' : ''}
                  placeholder="Ej: Hipertensión arterial, Diabetes tipo 2"
                />
                {errors.diagnosis && <p className="text-red-500 text-sm mt-1">{errors.diagnosis}</p>}
              </div>

              <div>
                <Label htmlFor="currentIllness">Enfermedad Actual *</Label>
                <textarea
                  id="currentIllness"
                  value={formData.currentIllness}
                  onChange={(e) => setFormData({ ...formData, currentIllness: e.target.value })}
                  className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.currentIllness ? 'border-red-500' : ''}`}
                  placeholder="Describa los síntomas y molestias actuales del paciente"
                  rows={3}
                />
                {errors.currentIllness && <p className="text-red-500 text-sm mt-1">{errors.currentIllness}</p>}
              </div>
            </div>

            {/* Signos Vitales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Signos Vitales</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bloodPressure" className="flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-red-500" />
                    Presión Arterial *
                  </Label>
                  <Input
                    id="bloodPressure"
                    value={formData.vitalSigns.bloodPressure}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      vitalSigns: { ...formData.vitalSigns, bloodPressure: e.target.value }
                    })}
                    className={errors.bloodPressure ? 'border-red-500' : ''}
                    placeholder="120/80"
                  />
                  {errors.bloodPressure && <p className="text-red-500 text-sm mt-1">{errors.bloodPressure}</p>}
                </div>

                <div>
                  <Label htmlFor="heartRate" className="flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-red-500" />
                    Frecuencia Cardíaca *
                  </Label>
                  <Input
                    id="heartRate"
                    value={formData.vitalSigns.heartRate}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      vitalSigns: { ...formData.vitalSigns, heartRate: e.target.value }
                    })}
                    className={errors.heartRate ? 'border-red-500' : ''}
                    placeholder="80"
                  />
                  {errors.heartRate && <p className="text-red-500 text-sm mt-1">{errors.heartRate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature" className="flex items-center">
                    <Thermometer className="h-4 w-4 mr-2 text-orange-500" />
                    Temperatura *
                  </Label>
                  <Input
                    id="temperature"
                    value={formData.vitalSigns.temperature}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      vitalSigns: { ...formData.vitalSigns, temperature: e.target.value }
                    })}
                    className={errors.temperature ? 'border-red-500' : ''}
                    placeholder="36.5°C"
                  />
                  {errors.temperature && <p className="text-red-500 text-sm mt-1">{errors.temperature}</p>}
                </div>

                <div>
                  <Label htmlFor="weight" className="flex items-center">
                    <Weight className="h-4 w-4 mr-2 text-blue-500" />
                    Peso
                  </Label>
                  <Input
                    id="weight"
                    value={formData.vitalSigns.weight}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      vitalSigns: { ...formData.vitalSigns, weight: e.target.value }
                    })}
                    placeholder="70kg"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="height" className="flex items-center">
                  <Ruler className="h-4 w-4 mr-2 text-green-500" />
                  Estatura
                </Label>
                <Input
                  id="height"
                  value={formData.vitalSigns.height}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    vitalSigns: { ...formData.vitalSigns, height: e.target.value }
                  })}
                  placeholder="170cm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white">
                Guardar Visita
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
