'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bed, 
  Plus, 
  Search, 
  Eye, 
  Calendar,
  UserPlus,
  Stethoscope,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';
import { HospitalizationModal } from '@/components/HospitalizationModal';

// Datos dummy para hospitalizaciones
const DUMMY_HOSPITALIZATIONS = [
  {
    id: '1',
    patientName: 'María González López',
    patientId: '0801-1985-12345',
    admissionDate: '2024-01-15',
    dischargeDate: null, // null significa que aún está hospitalizada
    room: 'Habitación 201',
    bed: 'Cama A',
    diagnosis: 'Neumonía severa',
    doctor: 'Dr. Carlos Mendoza',
    status: 'Activa',
    totalCost: 12500.00,
    charges: [
      {
        id: '1',
        description: 'Estadía por día',
        amount: 800.00,
        date: '2024-01-15',
        type: 'Estadía'
      },
      {
        id: '2',
        description: 'Antibióticos IV',
        amount: 450.00,
        date: '2024-01-15',
        type: 'Medicamento'
      },
      {
        id: '3',
        description: 'Radiografía de tórax',
        amount: 300.00,
        date: '2024-01-16',
        type: 'Examen'
      },
      {
        id: '4',
        description: 'Estadía por día',
        amount: 800.00,
        date: '2024-01-16',
        type: 'Estadía'
      }
    ],
    vitalSigns: {
      bloodPressure: '130/85',
      heartRate: '95',
      temperature: '37.8°C',
      oxygenSaturation: '94%'
    },
    notes: 'Paciente estable, respondiendo bien al tratamiento antibiótico.'
  },
  {
    id: '2',
    patientName: 'Juan Pérez Martínez',
    patientId: '0801-1978-67890',
    admissionDate: '2024-01-10',
    dischargeDate: '2024-01-18',
    room: 'Habitación 105',
    bed: 'Cama B',
    diagnosis: 'Apendicitis aguda',
    doctor: 'Dr. Ana Rodríguez',
    status: 'Alta',
    totalCost: 8500.00,
    charges: [
      {
        id: '5',
        description: 'Estadía por día',
        amount: 800.00,
        date: '2024-01-10',
        type: 'Estadía'
      },
      {
        id: '6',
        description: 'Cirugía de apendicectomía',
        amount: 3500.00,
        date: '2024-01-10',
        type: 'Cirugía'
      },
      {
        id: '7',
        description: 'Anestesia',
        amount: 800.00,
        date: '2024-01-10',
        type: 'Anestesia'
      },
      {
        id: '8',
        description: 'Medicamentos post-operatorios',
        amount: 1200.00,
        date: '2024-01-11',
        type: 'Medicamento'
      }
    ],
    vitalSigns: {
      bloodPressure: '120/80',
      heartRate: '75',
      temperature: '36.5°C',
      oxygenSaturation: '98%'
    },
    notes: 'Cirugía exitosa, paciente recuperándose satisfactoriamente.'
  },
  {
    id: '3',
    patientName: 'Ana Martínez Silva',
    patientId: '0801-1992-11111',
    admissionDate: '2024-01-20',
    dischargeDate: null,
    room: 'Habitación 302',
    bed: 'Cama A',
    diagnosis: 'Fractura de fémur',
    doctor: 'Dr. Luis Herrera',
    status: 'Activa',
    totalCost: 3200.00,
    charges: [
      {
        id: '9',
        description: 'Estadía por día',
        amount: 800.00,
        date: '2024-01-20',
        type: 'Estadía'
      },
      {
        id: '10',
        description: 'Cirugía de reducción de fractura',
        amount: 2000.00,
        date: '2024-01-20',
        type: 'Cirugía'
      },
      {
        id: '11',
        description: 'Analgésicos',
        amount: 400.00,
        date: '2024-01-20',
        type: 'Medicamento'
      }
    ],
    vitalSigns: {
      bloodPressure: '110/70',
      heartRate: '85',
      temperature: '36.8°C',
      oxygenSaturation: '97%'
    },
    notes: 'Fractura reducida exitosamente, paciente en observación.'
  }
];

export default function HospitalizationPage() {
  const [hospitalizations, setHospitalizations] = useState(DUMMY_HOSPITALIZATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [isHospitalizationModalOpen, setIsHospitalizationModalOpen] = useState(false);

  const filteredHospitalizations = hospitalizations.filter(hosp => {
    const matchesSearch = 
      hosp.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hosp.patientId.includes(searchTerm) ||
      hosp.room.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'Todos' || hosp.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const activeHospitalizations = hospitalizations.filter(h => h.status === 'Activa');
  const totalRevenue = hospitalizations.reduce((sum, h) => sum + h.totalCost, 0);

  const handleAddHospitalization = (hospitalizationData: any) => {
    const newHospitalization = {
      ...hospitalizationData,
      id: Date.now().toString(),
      charges: [
        {
          id: Date.now().toString(),
          description: 'Estadía por día',
          amount: 800.00,
          date: hospitalizationData.admissionDate,
          type: 'Estadía'
        }
      ],
      vitalSigns: {
        bloodPressure: hospitalizationData.vitalSigns.bloodPressure || '120/80',
        heartRate: hospitalizationData.vitalSigns.heartRate || '72',
        temperature: hospitalizationData.vitalSigns.temperature || '36.5°C',
        oxygenSaturation: hospitalizationData.vitalSigns.oxygenSaturation || '98%'
      },
      notes: hospitalizationData.notes || 'Paciente recién ingresado'
    };
    
    setHospitalizations([newHospitalization, ...hospitalizations]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activa':
        return 'bg-green-100 text-green-800';
      case 'Alta':
        return 'bg-blue-100 text-blue-800';
      case 'Transferida':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChargeTypeColor = (type: string) => {
    switch (type) {
      case 'Estadía':
        return 'bg-blue-100 text-blue-800';
      case 'Medicamento':
        return 'bg-green-100 text-green-800';
      case 'Examen':
        return 'bg-purple-100 text-purple-800';
      case 'Cirugía':
        return 'bg-red-100 text-red-800';
      case 'Anestesia':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Bed className="h-6 w-6 text-[#2E9589] mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Hospitalización
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {activeHospitalizations.length} pacientes activos
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gestión de Hospitalización
          </h2>
          <p className="text-gray-600">
            Administra las hospitalizaciones activas y el historial de pacientes internados
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Bed className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pacientes Activos</p>
                  <p className="text-2xl font-semibold text-gray-900">{activeHospitalizations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Promedio de Estancia</p>
                  <p className="text-2xl font-semibold text-gray-900">5.2 días</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                  <p className="text-2xl font-semibold text-gray-900">L. {totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ocupación</p>
                  <p className="text-2xl font-semibold text-gray-900">75%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente, habitación o número de identidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedStatus === 'Todos' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('Todos')}
              className={selectedStatus === 'Todos' ? 'bg-[#2E9589] hover:bg-[#2E9589]/90 text-white' : ''}
            >
              Todos
            </Button>
            <Button
              variant={selectedStatus === 'Activa' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('Activa')}
              className={selectedStatus === 'Activa' ? 'bg-[#2E9589] hover:bg-[#2E9589]/90 text-white' : ''}
            >
              Activas
            </Button>
            <Button
              variant={selectedStatus === 'Alta' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('Alta')}
              className={selectedStatus === 'Alta' ? 'bg-[#2E9589] hover:bg-[#2E9589]/90 text-white' : ''}
            >
              Con Alta
            </Button>
          </div>
          <Button
            onClick={() => setIsHospitalizationModalOpen(true)}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nueva Hospitalización
          </Button>
        </div>

        {/* Hospitalizations List */}
        <div className="grid gap-6">
          {filteredHospitalizations.map((hospitalization) => (
            <Card key={hospitalization.id} className="bg-transparent border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-[#2E9589]/10 rounded-full flex items-center justify-center">
                          <Bed className="h-6 w-6 text-[#2E9589]" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {hospitalization.patientName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hospitalization.status)}`}>
                            {hospitalization.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Habitación:</span> {hospitalization.room} - {hospitalization.bed}
                          </div>
                          <div>
                            <span className="font-medium">Médico:</span> {hospitalization.doctor}
                          </div>
                          <div>
                            <span className="font-medium">Ingreso:</span> {new Date(hospitalization.admissionDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Costo Total:</span> L. {hospitalization.totalCost.toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className="font-medium text-sm text-gray-600">Diagnóstico:</span>
                          <span className="text-sm text-gray-900 ml-2">{hospitalization.diagnosis}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#2E9589] border-[#2E9589] hover:bg-[#2E9589] hover:text-white"
                    >
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
                
                {/* Charges Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Cobros Recientes:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {hospitalization.charges.slice(0, 4).map((charge) => (
                      <div key={charge.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChargeTypeColor(charge.type)}`}>
                            {charge.type}
                          </span>
                          <span className="text-sm text-gray-900">{charge.description}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">L. {charge.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{new Date(charge.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hospitalization.charges.length > 4 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{hospitalization.charges.length - 4} cobros más
                    </p>
                  )}
                </div>

                {/* Vital Signs */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Signos Vitales Actuales:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Presión:</span>
                      <span className="ml-2 text-gray-900">{hospitalization.vitalSigns.bloodPressure}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">FC:</span>
                      <span className="ml-2 text-gray-900">{hospitalization.vitalSigns.heartRate} bpm</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Temp:</span>
                      <span className="ml-2 text-gray-900">{hospitalization.vitalSigns.temperature}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">SpO2:</span>
                      <span className="ml-2 text-gray-900">{hospitalization.vitalSigns.oxygenSaturation}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredHospitalizations.length === 0 && (
          <Card className="bg-transparent border-gray-200">
            <CardContent className="p-8 text-center">
              <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron hospitalizaciones
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay hospitalizaciones registradas'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      <HospitalizationModal
        isOpen={isHospitalizationModalOpen}
        onClose={() => setIsHospitalizationModalOpen(false)}
        onSave={handleAddHospitalization}
      />
    </div>
  );
}
