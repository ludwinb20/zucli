'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Scan, Clock, DollarSign, Calendar } from 'lucide-react';

export default function XRayPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    studyType: '',
    scheduledTime: '',
    notes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  // Precios variables por horario (dummy data)
  const priceSchedule = [
    { time: '08:00 - 12:00', price: 800, type: 'Horario Regular' },
    { time: '12:00 - 18:00', price: 1000, type: 'Horario Pico' },
    { time: '18:00 - 22:00', price: 1200, type: 'Horario Nocturno' },
    { time: '22:00 - 08:00', price: 1500, type: 'Horario Emergencia' }
  ];

  const studyTypes = [
    { id: 'torax', name: 'Radiografía de Tórax', basePrice: 800 },
    { id: 'abdomen', name: 'Radiografía de Abdomen', basePrice: 900 },
    { id: 'columna', name: 'Radiografía de Columna', basePrice: 1000 },
    { id: 'extremidades', name: 'Radiografía de Extremidades', basePrice: 700 },
    { id: 'craneo', name: 'Radiografía de Cráneo', basePrice: 850 }
  ];

  const getCurrentPrice = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 8 && currentHour < 12) return 800;
    if (currentHour >= 12 && currentHour < 18) return 1000;
    if (currentHour >= 18 && currentHour < 22) return 1200;
    return 1500;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button> */}
            <div className="flex items-center">
              {/* <Scan className="h-6 w-6 text-[#1E3A8A] mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Rayos X
              </h1> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario Principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Programar Estudio Radiológico</CardTitle>
                <CardDescription>
                  Complete la información para programar el estudio
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
                  </div>

                  {/* Tipo de Estudio */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Tipo de Estudio</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="studyType">Seleccionar Estudio</Label>
                      <select
                        id="studyType"
                        name="studyType"
                        value={formData.studyType}
                        onChange={(e) => setFormData(prev => ({ ...prev, studyType: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Seleccionar tipo de estudio...</option>
                        {studyTypes.map((study) => (
                          <option key={study.id} value={study.id}>
                            {study.name} - L. {study.basePrice}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Programación */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Programación</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="scheduledTime">Fecha y Hora</Label>
                      <Input
                        id="scheduledTime"
                        name="scheduledTime"
                        type="datetime-local"
                        value={formData.scheduledTime}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas Adicionales</Label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Instrucciones especiales, preparación, etc."
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
                          Programando...
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Programar Estudio
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Precios por Horario */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Precios por Horario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {priceSchedule.map((schedule, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${
                        schedule.price === getCurrentPrice() 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {schedule.time}
                          </p>
                          <p className="text-xs text-gray-600">
                            {schedule.type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            L. {schedule.price}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-[#2E9589]/10 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-[#2E9589] mr-2" />
                    <p className="text-sm font-medium text-gray-900">
                      Precio Actual: L. {getCurrentPrice()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información del Paciente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Paciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Nombre:</p>
                    <p className="text-sm text-gray-900">Carlos Ruiz</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Edad:</p>
                    <p className="text-sm text-gray-900">42 años</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Teléfono:</p>
                    <p className="text-sm text-gray-900">+504 8888-8888</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">RTN:</p>
                    <p className="text-sm text-gray-900">0801-1982-54321</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estudios Programados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estudios Programados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border-l-4 border-purple-500 pl-3">
                    <p className="text-sm font-medium">Radiografía de Tórax</p>
                    <p className="text-xs text-gray-600">Hoy 14:30</p>
                    <p className="text-xs text-gray-500">Paciente: Ana López</p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-3">
                    <p className="text-sm font-medium">Radiografía de Abdomen</p>
                    <p className="text-xs text-gray-600">Mañana 09:00</p>
                    <p className="text-xs text-gray-500">Paciente: Juan Pérez</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
