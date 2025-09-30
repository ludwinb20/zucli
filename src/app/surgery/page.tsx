'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Zap, 
  Plus, 
  Search, 
  Eye, 
  Calendar,
  UserPlus,
  Clock,
  DollarSign,
  Activity,
  Users,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { SurgeryModal } from '@/components/SurgeryModal';

// Datos dummy para cirugías
const DUMMY_SURGERIES = [
  {
    id: '1',
    patientName: 'María González López',
    patientId: '0801-1985-12345',
    surgeryDate: '2024-01-20',
    scheduledTime: '08:00',
    actualStartTime: '08:15',
    actualEndTime: '10:30',
    surgeryType: 'Apendicectomía laparoscópica',
    surgeon: 'Dr. Carlos Mendoza',
    anesthesiologist: 'Dr. Ana Rodríguez',
    nurse: 'Enf. Luis Herrera',
    operatingRoom: 'Quirófano 1',
    status: 'Completada',
    duration: '2h 15m',
    cost: 8500.00,
    complications: 'Ninguna',
    notes: 'Cirugía exitosa, paciente estable. Recuperación sin complicaciones.',
    preOpDiagnosis: 'Apendicitis aguda',
    postOpDiagnosis: 'Apendicitis aguda resuelta',
    bloodLoss: 'Mínima',
    anesthesia: 'General',
    recoveryTime: '2 horas',
    dischargeDate: '2024-01-22'
  },
  {
    id: '2',
    patientName: 'Juan Pérez Martínez',
    patientId: '0801-1978-67890',
    surgeryDate: '2024-01-18',
    scheduledTime: '14:00',
    actualStartTime: '14:30',
    actualEndTime: '16:45',
    surgeryType: 'Colecistectomía laparoscópica',
    surgeon: 'Dr. Luis Herrera',
    anesthesiologist: 'Dr. María Silva',
    nurse: 'Enf. Carmen López',
    operatingRoom: 'Quirófano 2',
    status: 'Completada',
    duration: '2h 15m',
    cost: 12000.00,
    complications: 'Ninguna',
    notes: 'Procedimiento realizado sin complicaciones. Paciente toleró bien la cirugía.',
    preOpDiagnosis: 'Colelitiasis sintomática',
    postOpDiagnosis: 'Colelitiasis resuelta',
    bloodLoss: 'Mínima',
    anesthesia: 'General',
    recoveryTime: '3 horas',
    dischargeDate: '2024-01-20'
  },
  {
    id: '3',
    patientName: 'Ana Martínez Silva',
    patientId: '0801-1992-11111',
    surgeryDate: '2024-01-25',
    scheduledTime: '10:00',
    actualStartTime: null,
    actualEndTime: null,
    surgeryType: 'Hernia inguinal',
    surgeon: 'Dr. Roberto Díaz',
    anesthesiologist: 'Dr. Patricia Vega',
    nurse: 'Enf. Miguel Torres',
    operatingRoom: 'Quirófano 3',
    status: 'Programada',
    duration: null,
    cost: 6500.00,
    complications: null,
    notes: 'Cirugía programada para el 25 de enero. Paciente en ayunas desde medianoche.',
    preOpDiagnosis: 'Hernia inguinal derecha',
    postOpDiagnosis: null,
    bloodLoss: null,
    anesthesia: 'Regional',
    recoveryTime: null,
    dischargeDate: null
  },
  {
    id: '4',
    patientName: 'Carlos Ramírez López',
    patientId: '0801-1980-55555',
    surgeryDate: '2024-01-22',
    scheduledTime: '09:00',
    actualStartTime: '09:00',
    actualEndTime: '11:30',
    surgeryType: 'Artroscopia de rodilla',
    surgeon: 'Dr. Elena Morales',
    anesthesiologist: 'Dr. Fernando Castro',
    nurse: 'Enf. Rosa Martínez',
    operatingRoom: 'Quirófano 1',
    status: 'Completada',
    duration: '2h 30m',
    cost: 9500.00,
    complications: 'Sangrado leve controlado',
    notes: 'Cirugía exitosa con sangrado leve que fue controlado. Paciente estable.',
    preOpDiagnosis: 'Lesión de menisco interno',
    postOpDiagnosis: 'Menisco interno reparado',
    bloodLoss: 'Leve',
    anesthesia: 'Regional',
    recoveryTime: '4 horas',
    dischargeDate: '2024-01-24'
  },
  {
    id: '5',
    patientName: 'Sofia Herrera González',
    patientId: '0801-1988-77777',
    surgeryDate: '2024-01-23',
    scheduledTime: '13:00',
    actualStartTime: '13:15',
    actualEndTime: '15:00',
    surgeryType: 'Cesárea',
    surgeon: 'Dr. Carmen Vega',
    anesthesiologist: 'Dr. Diego Morales',
    nurse: 'Enf. Laura Sánchez',
    operatingRoom: 'Quirófano 4',
    status: 'Completada',
    duration: '1h 45m',
    cost: 15000.00,
    complications: 'Ninguna',
    notes: 'Cesárea exitosa. Bebé nacido a las 14:30, peso 3.2kg. Madre y bebé estables.',
    preOpDiagnosis: 'Embarazo a término, indicación de cesárea',
    postOpDiagnosis: 'Cesárea exitosa',
    bloodLoss: 'Normal',
    anesthesia: 'Regional',
    recoveryTime: '2 horas',
    dischargeDate: '2024-01-26'
  }
];

export default function SurgeryPage() {
  const [surgeries, setSurgeries] = useState(DUMMY_SURGERIES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [isSurgeryModalOpen, setIsSurgeryModalOpen] = useState(false);

  const filteredSurgeries = surgeries.filter(surgery => {
    const matchesSearch = 
      surgery.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surgery.patientId.includes(searchTerm) ||
      surgery.surgeryType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surgery.surgeon.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'Todos' || surgery.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const completedSurgeries = surgeries.filter(s => s.status === 'Completada');
  const scheduledSurgeries = surgeries.filter(s => s.status === 'Programada');
  const totalRevenue = completedSurgeries.reduce((sum, s) => sum + s.cost, 0);

  const handleAddSurgery = (surgeryData: any) => {
    const newSurgery = {
      ...surgeryData,
      id: Date.now().toString(),
      cost: 0,
      complications: null,
      postOpDiagnosis: null,
      bloodLoss: null,
      recoveryTime: null,
      dischargeDate: null,
      actualStartTime: null,
      actualEndTime: null,
      duration: null
    };
    
    setSurgeries([newSurgery, ...surgeries]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completada':
        return 'bg-green-100 text-green-800';
      case 'Programada':
        return 'bg-blue-100 text-blue-800';
      case 'En Progreso':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completada':
        return <CheckCircle className="h-4 w-4" />;
      case 'Programada':
        return <Calendar className="h-4 w-4" />;
      case 'En Progreso':
        return <Clock className="h-4 w-4" />;
      case 'Cancelada':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Zap className="h-6 w-6 text-[#2E9589] mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                Cirugía
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {scheduledSurgeries.length} programadas hoy
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
            Gestión de Cirugías
          </h2>
          <p className="text-gray-600">
            Administra las cirugías programadas, en progreso y completadas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Programadas Hoy</p>
                  <p className="text-2xl font-semibold text-gray-900">{scheduledSurgeries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completadas</p>
                  <p className="text-2xl font-semibold text-gray-900">{completedSurgeries.length}</p>
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
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tiempo Promedio</p>
                  <p className="text-2xl font-semibold text-gray-900">2.2h</p>
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
                placeholder="Buscar por paciente, tipo de cirugía o cirujano..."
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
              variant={selectedStatus === 'Programada' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('Programada')}
              className={selectedStatus === 'Programada' ? 'bg-[#2E9589] hover:bg-[#2E9589]/90 text-white' : ''}
            >
              Programadas
            </Button>
            <Button
              variant={selectedStatus === 'Completada' ? 'default' : 'outline'}
              onClick={() => setSelectedStatus('Completada')}
              className={selectedStatus === 'Completada' ? 'bg-[#2E9589] hover:bg-[#2E9589]/90 text-white' : ''}
            >
              Completadas
            </Button>
          </div>
          <Button
            onClick={() => setIsSurgeryModalOpen(true)}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Programar Cirugía
          </Button>
        </div>

        {/* Surgeries List */}
        <div className="grid gap-6">
          {filteredSurgeries.map((surgery) => (
            <Card key={surgery.id} className="bg-transparent border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-[#2E9589]/10 rounded-full flex items-center justify-center">
                          <Zap className="h-6 w-6 text-[#2E9589]" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {surgery.patientName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(surgery.status)}`}>
                            {getStatusIcon(surgery.status)}
                            <span>{surgery.status}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Cirugía:</span> {surgery.surgeryType}
                          </div>
                          <div>
                            <span className="font-medium">Cirujano:</span> {surgery.surgeon}
                          </div>
                          <div>
                            <span className="font-medium">Fecha:</span> {new Date(surgery.surgeryDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">Costo:</span> L. {surgery.cost.toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Quirófano:</span> {surgery.operatingRoom}
                          </div>
                          <div>
                            <span className="font-medium">Anestesiólogo:</span> {surgery.anesthesiologist}
                          </div>
                          <div>
                            <span className="font-medium">Hora Programada:</span> {surgery.scheduledTime}
                          </div>
                          {surgery.duration && (
                            <div>
                              <span className="font-medium">Duración:</span> {surgery.duration}
                            </div>
                          )}
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
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                    {surgery.status === 'Programada' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Iniciar
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Surgery Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Diagnóstico Pre-operatorio:</h4>
                      <p className="text-sm text-gray-600">{surgery.preOpDiagnosis}</p>
                    </div>
                    {surgery.postOpDiagnosis && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Diagnóstico Post-operatorio:</h4>
                        <p className="text-sm text-gray-600">{surgery.postOpDiagnosis}</p>
                      </div>
                    )}
                  </div>
                  
                  {surgery.notes && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Notas:</h4>
                      <p className="text-sm text-gray-600">{surgery.notes}</p>
                    </div>
                  )}

                  {/* Surgery Timeline */}
                  {surgery.status === 'Completada' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Cronología:</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Inicio programado:</span>
                          <span className="text-sm font-medium text-gray-900">{surgery.scheduledTime}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Inicio real:</span>
                          <span className="text-sm font-medium text-gray-900">{surgery.actualStartTime}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Finalización:</span>
                          <span className="text-sm font-medium text-gray-900">{surgery.actualEndTime}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">Tiempo de recuperación:</span>
                          <span className="text-sm font-medium text-gray-900">{surgery.recoveryTime}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSurgeries.length === 0 && (
          <Card className="bg-transparent border-gray-200">
            <CardContent className="p-8 text-center">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron cirugías
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay cirugías registradas'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      <SurgeryModal
        isOpen={isSurgeryModalOpen}
        onClose={() => setIsSurgeryModalOpen(false)}
        onSave={handleAddSurgery}
      />
    </div>
  );
}
