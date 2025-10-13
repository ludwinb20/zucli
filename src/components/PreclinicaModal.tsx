'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PreclinicaData, PreclinicaModalProps } from '@/types/components';

export default function PreclinicaModal({
  isOpen,
  onClose,
  appointment,
  onSave,
  isLoading = false
}: PreclinicaModalProps) {
  const [formData, setFormData] = useState<PreclinicaData>({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Limpiar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
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
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.presionArterial.trim()) {
      newErrors.presionArterial = 'La presión arterial es requerida';
    }

    if (!formData.temperatura.trim()) {
      newErrors.temperatura = 'La temperatura es requerida';
    }

    if (!formData.fc.trim()) {
      newErrors.fc = 'La frecuencia cardíaca es requerida';
    }

    if (!formData.fr.trim()) {
      newErrors.fr = 'La frecuencia respiratoria es requerida';
    }

    if (!formData.satO2.trim()) {
      newErrors.satO2 = 'La saturación de oxígeno es requerida';
    }

    if (!formData.peso.trim()) {
      newErrors.peso = 'El peso es requerido';
    }

    if (!formData.talla.trim()) {
      newErrors.talla = 'La talla es requerida';
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
      await onSave(appointment.id, formData);
    } catch (error) {
      console.error('Error saving preclinica:', error);
    }
  };

  const handleInputChange = (field: keyof PreclinicaData, value: string) => {
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Preclínica
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Registro de signos vitales y evaluación inicial para la cita médica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Signos Vitales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Signos Vitales
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="presionArterial" className="text-sm font-medium text-gray-700">
                  Presión Arterial *
                </Label>
                <Input
                  id="presionArterial"
                  value={formData.presionArterial}
                  onChange={(e) => handleInputChange('presionArterial', e.target.value)}
                  placeholder="120/80"
                  className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.presionArterial ? 'border-red-500' : ''}`}
                />
                {errors.presionArterial && (
                  <p className="text-sm text-red-500">{errors.presionArterial}</p>
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
                  value={formData.temperatura}
                  onChange={(e) => handleInputChange('temperatura', e.target.value)}
                  placeholder="36.5"
                  className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.temperatura ? 'border-red-500' : ''}`}
                />
                {errors.temperatura && (
                  <p className="text-sm text-red-500">{errors.temperatura}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fc" className="text-sm font-medium text-gray-700">
                  FC (lpm) *
                </Label>
                <Input
                  id="fc"
                  type="number"
                  value={formData.fc}
                  onChange={(e) => handleInputChange('fc', e.target.value)}
                  placeholder="72"
                  className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.fc ? 'border-red-500' : ''}`}
                />
                {errors.fc && (
                  <p className="text-sm text-red-500">{errors.fc}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fr" className="text-sm font-medium text-gray-700">
                  FR (rpm) *
                </Label>
                <Input
                  id="fr"
                  type="number"
                  value={formData.fr}
                  onChange={(e) => handleInputChange('fr', e.target.value)}
                  placeholder="16"
                  className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.fr ? 'border-red-500' : ''}`}
                />
                {errors.fr && (
                  <p className="text-sm text-red-500">{errors.fr}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="satO2" className="text-sm font-medium text-gray-700">
                  Sat O₂ (%) *
                </Label>
                <Input
                  id="satO2"
                  type="number"
                  value={formData.satO2}
                  onChange={(e) => handleInputChange('satO2', e.target.value)}
                  placeholder="98"
                  className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.satO2 ? 'border-red-500' : ''}`}
                />
                {errors.satO2 && (
                  <p className="text-sm text-red-500">{errors.satO2}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso" className="text-sm font-medium text-gray-700">
                  Peso (lbs) *
                </Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={formData.peso}
                  onChange={(e) => handleInputChange('peso', e.target.value)}
                  placeholder="150.0"
                  className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.peso ? 'border-red-500' : ''}`}
                />
                {errors.peso && (
                  <p className="text-sm text-red-500">{errors.peso}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="talla" className="text-sm font-medium text-gray-700">
                  Talla (cm) *
                </Label>
                <Input
                  id="talla"
                  type="number"
                  step="0.1"
                  value={formData.talla}
                  onChange={(e) => handleInputChange('talla', e.target.value)}
                  placeholder="170.0"
                  className={`border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] ${errors.talla ? 'border-red-500' : ''}`}
                />
                {errors.talla && (
                  <p className="text-sm text-red-500">{errors.talla}</p>
                )}
              </div>
            </div>
          </div>

          {/* Evaluación Médica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Evaluación Médica
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="examenFisico" className="text-sm font-medium text-gray-700">
                  Examen Físico
                </Label>
                <Textarea
                  id="examenFisico"
                  value={formData.examenFisico}
                  onChange={(e) => handleInputChange('examenFisico', e.target.value)}
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
                  value={formData.idc}
                  onChange={(e) => handleInputChange('idc', e.target.value)}
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
                  value={formData.tx}
                  onChange={(e) => handleInputChange('tx', e.target.value)}
                  placeholder="Tratamiento indicado..."
                  rows={3}
                  className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>
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
              {isLoading ? 'Guardando...' : 'Marcar como Pendiente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
