'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Settings, Plus, Edit, Trash2, Save, X } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('services');
  const [isEditing, setIsEditing] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: 'consulta'
  });

  // Datos dummy para servicios
  const [services, setServices] = useState([
    {
      id: '1',
      name: 'Consulta Externa',
      description: 'Consulta médica general',
      basePrice: 800,
      category: 'consulta',
      isActive: true
    },
    {
      id: '2',
      name: 'Radiografía de Tórax',
      description: 'Estudio radiológico del tórax',
      basePrice: 800,
      category: 'rayos_x',
      isActive: true
    },
    {
      id: '3',
      name: 'Radiografía de Abdomen',
      description: 'Estudio radiológico del abdomen',
      basePrice: 900,
      category: 'rayos_x',
      isActive: true
    },
    {
      id: '4',
      name: 'Radiografía de Columna',
      description: 'Estudio radiológico de la columna vertebral',
      basePrice: 1000,
      category: 'rayos_x',
      isActive: true
    },
    {
      id: '5',
      name: 'Radiografía de Extremidades',
      description: 'Estudio radiológico de brazos y piernas',
      basePrice: 700,
      category: 'rayos_x',
      isActive: true
    }
  ]);

  const [priceSchedules, setPriceSchedules] = useState([
    {
      id: '1',
      serviceId: '2',
      serviceName: 'Radiografía de Tórax',
      startTime: '08:00',
      endTime: '12:00',
      price: 800,
      type: 'Horario Regular'
    },
    {
      id: '2',
      serviceId: '2',
      serviceName: 'Radiografía de Tórax',
      startTime: '12:00',
      endTime: '18:00',
      price: 1000,
      type: 'Horario Pico'
    },
    {
      id: '3',
      serviceId: '2',
      serviceName: 'Radiografía de Tórax',
      startTime: '18:00',
      endTime: '22:00',
      price: 1200,
      type: 'Horario Nocturno'
    }
  ]);

  const handleAddService = async () => {
    setIsLoading(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const service = {
      id: Date.now().toString(),
      ...newService,
      basePrice: parseFloat(newService.basePrice),
      isActive: true
    };
    
    setServices(prev => [...prev, service]);
    setNewService({ name: '', description: '', basePrice: '', category: 'consulta' });
    setIsLoading(false);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsLoading(true);
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setServices(prev => prev.map(s => 
      s.id === editingService.id ? { ...s, ...editingService } : s
    ));
    
    setIsEditing(false);
    setEditingService(null);
    setIsLoading(false);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('¿Está seguro de que desea eliminar este servicio?')) {
      setIsLoading(true);
      
      // Simular eliminación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setServices(prev => prev.filter(s => s.id !== serviceId));
      setIsLoading(false);
    }
  };

  const ServiceCard = ({ service }: { service: any }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-medium text-gray-900">{service.name}</h4>
            <p className="text-sm text-gray-600">{service.description}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">L. {service.basePrice}</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {service.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 capitalize">
            Categoría: {service.category.replace('_', ' ')}
          </span>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleEditService(service)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleDeleteService(service.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
              {/* <Settings className="h-6 w-6 text-gray-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Administración
              </h1> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'services'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Servicios
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'prices'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Precios Variables
          </button>
        </div>

        {activeTab === 'services' && (
          <div className="space-y-6">
            {/* Agregar Nuevo Servicio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar Nuevo Servicio
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Servicio</Label>
                    <Input
                      id="name"
                      value={newService.name}
                      onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Consulta Externa"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <select
                      id="category"
                      value={newService.category}
                      onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="consulta">Consulta</option>
                      <option value="rayos_x">Rayos X</option>
                      <option value="laboratorio">Laboratorio</option>
                      <option value="otros">Otros</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Precio Base (L.)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      value={newService.basePrice}
                      onChange={(e) => setNewService(prev => ({ ...prev, basePrice: e.target.value }))}
                      placeholder="800.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      value={newService.description}
                      onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción del servicio"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleAddService}
                    disabled={isLoading || !newService.name || !newService.basePrice}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Agregando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Servicio
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Servicios */}
            <Card>
              <CardHeader>
                <CardTitle>Servicios Configurados ({services.length})</CardTitle>
                <CardDescription>
                  Gestionar servicios médicos disponibles
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'prices' && (
          <Card>
            <CardHeader>
              <CardTitle>Precios Variables por Horario</CardTitle>
              <CardDescription>
                Configurar precios variables para servicios según el horario
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                {priceSchedules.map((schedule) => (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{schedule.serviceName}</h4>
                        <p className="text-sm text-gray-600">
                          {schedule.startTime} - {schedule.endTime}
                        </p>
                        <p className="text-xs text-gray-500">{schedule.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">L. {schedule.price}</p>
                        <div className="flex space-x-2 mt-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-[#2E9589]/10 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Información</h4>
                  <p className="text-sm text-gray-600">
                    Los precios variables permiten ajustar el costo de los servicios según el horario de atención. 
                    Esto es especialmente útil para servicios como Rayos X que pueden tener mayor demanda en ciertos horarios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de Edición */}
        {isEditing && editingService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Editar Servicio</CardTitle>
                <CardDescription>
                  Modificar información del servicio
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editName">Nombre</Label>
                    <Input
                      id="editName"
                      value={editingService.name}
                      onChange={(e) => setEditingService(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editDescription">Descripción</Label>
                    <Input
                      id="editDescription"
                      value={editingService.description}
                      onChange={(e) => setEditingService(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editPrice">Precio Base</Label>
                    <Input
                      id="editPrice"
                      type="number"
                      step="0.01"
                      value={editingService.basePrice}
                      onChange={(e) => setEditingService(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditingService(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
