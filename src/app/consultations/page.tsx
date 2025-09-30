'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stethoscope, Save, Send } from 'lucide-react';

export default function ExternalConsultationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    doctorName: '',
    diagnosis: '',
    currentIllness: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: ''
    },
    treatment: '',
    observations: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVitalSignsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    router.push('/dashboard');
  };

  const handleSendToBilling = async () => {
    setIsLoading(true);
    
    // Simular envío a facturación
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    router.push('/dashboard');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Consulta</CardTitle>
                <CardDescription>
                  Complete la información de la consulta médica
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información del Paciente */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Información del Paciente</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="patientId">ID del Paciente</Label>
                        <Input
                          id="patientId"
                          name="patientId"
                          value={formData.patientId}
                          onChange={handleInputChange}
                          placeholder="Buscar por ID..."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="patientName">Nombre del Paciente</Label>
                        <Input
                          id="patientName"
                          name="patientName"
                          value={formData.patientName}
                          onChange={handleInputChange}
                          placeholder="Nombre completo..."
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="doctorName">Médico Tratante *</Label>
                      <Input
                        id="doctorName"
                        name="doctorName"
                        value={formData.doctorName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Diagnóstico */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Diagnóstico</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currentIllness">Enfermedad Actual</Label>
                      <textarea
                        id="currentIllness"
                        name="currentIllness"
                        value={formData.currentIllness}
                        onChange={handleInputChange}
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Descripción de los síntomas actuales..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnóstico</Label>
                      <textarea
                        id="diagnosis"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleInputChange}
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Diagnóstico médico..."
                      />
                    </div>
                  </div>

                  {/* Signos Vitales */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Signos Vitales</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bloodPressure">Presión Arterial</Label>
                        <Input
                          id="bloodPressure"
                          name="bloodPressure"
                          value={formData.vitalSigns.bloodPressure}
                          onChange={handleVitalSignsChange}
                          placeholder="120/80"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="heartRate">Frecuencia Cardíaca</Label>
                        <Input
                          id="heartRate"
                          name="heartRate"
                          value={formData.vitalSigns.heartRate}
                          onChange={handleVitalSignsChange}
                          placeholder="72 bpm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="temperature">Temperatura</Label>
                        <Input
                          id="temperature"
                          name="temperature"
                          value={formData.vitalSigns.temperature}
                          onChange={handleVitalSignsChange}
                          placeholder="36.5°C"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="weight">Peso</Label>
                        <Input
                          id="weight"
                          name="weight"
                          value={formData.vitalSigns.weight}
                          onChange={handleVitalSignsChange}
                          placeholder="70 kg"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="height">Altura</Label>
                        <Input
                          id="height"
                          name="height"
                          value={formData.vitalSigns.height}
                          onChange={handleVitalSignsChange}
                          placeholder="170 cm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tratamiento */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Tratamiento</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="treatment">Tratamiento Prescrito</Label>
                      <textarea
                        id="treatment"
                        name="treatment"
                        value={formData.treatment}
                        onChange={handleInputChange}
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Medicamentos, indicaciones, etc."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="observations">Observaciones</Label>
                      <textarea
                        id="observations"
                        name="observations"
                        value={formData.observations}
                        onChange={handleInputChange}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Observaciones adicionales..."
                      />
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.back()}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Consulta
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleSendToBilling}
                      disabled={isLoading}
                      className="bg-[#4CAF50] hover:bg-[#4CAF50]/90 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar a Facturación
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Información del Paciente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Paciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nombre:</p>
                    <p className="text-sm text-gray-900">María González</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Edad:</p>
                    <p className="text-sm text-gray-900">35 años</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Teléfono:</p>
                    <p className="text-sm text-gray-900">+504 9999-9999</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">RTN:</p>
                    <p className="text-sm text-gray-900">0801-1990-12345</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Historial Reciente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historial Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <p className="text-sm font-medium">Consulta General</p>
                    <p className="text-xs text-gray-600">15 Sep 2024</p>
                    <p className="text-xs text-gray-500">Dr. Juan Pérez</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-3">
                    <p className="text-sm font-medium">Rayos X</p>
                    <p className="text-xs text-gray-600">10 Sep 2024</p>
                    <p className="text-xs text-gray-500">Torax</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}
