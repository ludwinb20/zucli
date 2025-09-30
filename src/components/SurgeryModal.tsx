'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { 
  Search, 
  User, 
  Zap, 
  CheckCircle,
  X,
  ChevronDownIcon
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  lastName: string;
  identityNumber: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
}

interface Surgery {
  id: string;
  patientName: string;
  patientId: string;
  surgeryDate: string;
  scheduledTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  surgeryType: string;
  surgeon: string;
  anesthesiologist: string;
  nurse: string;
  operatingRoom: string;
  status: string;
  duration: string | null;
  cost: number;
  complications: string | null;
  notes: string;
  preOpDiagnosis: string;
  postOpDiagnosis: string | null;
  bloodLoss: string | null;
  anesthesia: string;
  recoveryTime: string | null;
  dischargeDate: string | null;
}

interface SurgeryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (surgeryData: Omit<Surgery, 'id'>) => void;
}

// Datos dummy de pacientes para selección
const DUMMY_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'María',
    lastName: 'González López',
    identityNumber: '0801-1985-12345',
    birthDate: '1985-03-15',
    gender: 'Femenino',
    phone: '9876-5432',
    email: 'maria.gonzalez@email.com',
    address: 'Col. Las Flores, Tegucigalpa'
  },
  {
    id: '2',
    name: 'Juan',
    lastName: 'Pérez Martínez',
    identityNumber: '0801-1978-67890',
    birthDate: '1978-07-22',
    gender: 'Masculino',
    phone: '8765-4321',
    email: 'juan.perez@email.com',
    address: 'Col. Residencial, San Pedro Sula'
  },
  {
    id: '3',
    name: 'Ana',
    lastName: 'Martínez Silva',
    identityNumber: '0801-1992-11111',
    birthDate: '1992-11-08',
    gender: 'Femenino',
    phone: '7654-3210',
    email: 'ana.martinez@email.com',
    address: 'Col. Centro, La Ceiba'
  },
  {
    id: '4',
    name: 'Carlos',
    lastName: 'Ramírez López',
    identityNumber: '0801-1980-55555',
    birthDate: '1980-05-12',
    gender: 'Masculino',
    phone: '6543-2109',
    email: 'carlos.ramirez@email.com',
    address: 'Col. Satélite, Tegucigalpa'
  },
  {
    id: '5',
    name: 'Sofia',
    lastName: 'Herrera González',
    identityNumber: '0801-1988-77777',
    birthDate: '1988-09-25',
    gender: 'Femenino',
    phone: '5432-1098',
    email: 'sofia.herrera@email.com',
    address: 'Col. Palmira, San Pedro Sula'
  }
];

const OPERATING_ROOMS = [
  { id: '1', name: 'Quirófano 1', type: 'General', floor: '2' },
  { id: '2', name: 'Quirófano 2', type: 'General', floor: '2' },
  { id: '3', name: 'Quirófano 3', type: 'General', floor: '2' },
  { id: '4', name: 'Quirófano 4', type: 'Obstetricia', floor: '3' },
  { id: '5', name: 'Quirófano 5', type: 'Cardiovascular', floor: '3' }
];

const SURGERY_TYPES = [
  'Apendicectomía laparoscópica',
  'Colecistectomía laparoscópica',
  'Hernia inguinal',
  'Hernia umbilical',
  'Artroscopia de rodilla',
  'Artroscopia de hombro',
  'Cesárea',
  'Histerectomía',
  'Cirugía de catarata',
  'Cirugía de vesícula',
  'Cirugía de tiroides',
  'Cirugía plástica',
  'Cirugía cardiovascular',
  'Cirugía neurológica',
  'Cirugía traumatológica'
];

const SURGEONS = [
  'Dr. Carlos Mendoza',
  'Dr. Ana Rodríguez',
  'Dr. Luis Herrera',
  'Dr. Roberto Díaz',
  'Dr. Elena Morales',
  'Dr. Carmen Vega',
  'Dr. Fernando Castro',
  'Dr. Patricia Vega'
];

const ANESTHESIOLOGISTS = [
  'Dr. María Silva',
  'Dr. Diego Morales',
  'Dr. Patricia Vega',
  'Dr. Fernando Castro',
  'Dr. Laura Sánchez',
  'Dr. Miguel Torres'
];

const NURSES = [
  'Enf. Luis Herrera',
  'Enf. Carmen López',
  'Enf. Miguel Torres',
  'Enf. Rosa Martínez',
  'Enf. Laura Sánchez',
  'Enf. Carlos Ramírez'
];

const ANESTHESIA_TYPES = ['General', 'Regional', 'Local', 'Sedación'];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export function SurgeryModal({ isOpen, onClose, onSave }: SurgeryModalProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    surgeryDate: new Date().toISOString().split('T')[0],
    scheduledTime: '',
    surgeryType: '',
    surgeon: '',
    anesthesiologist: '',
    nurse: '',
    operatingRoom: '',
    preOpDiagnosis: '',
    anesthesia: '',
    estimatedDuration: '',
    notes: '',
    specialInstructions: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredPatients = DUMMY_PATIENTS.filter(patient =>
    `${patient.name} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.identityNumber.includes(searchTerm)
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedPatient) newErrors.patient = 'Debe seleccionar un paciente';
    if (!formData.surgeryType) newErrors.surgeryType = 'El tipo de cirugía es requerido';
    if (!formData.surgeon) newErrors.surgeon = 'El cirujano es requerido';
    if (!formData.preOpDiagnosis.trim()) newErrors.preOpDiagnosis = 'El diagnóstico pre-operatorio es requerido';
    if (!formData.scheduledTime) newErrors.scheduledTime = 'La hora programada es requerida';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({
      ...prev,
      patientId: patient.id
    }));
    setShowPatientSearch(false);
    setSearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);

    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000));

    const surgeryData: Omit<Surgery, 'id'> = {
      ...formData,
      patientName: selectedPatient ? `${selectedPatient.name} ${selectedPatient.lastName}` : '',
      patientId: selectedPatient?.identityNumber || '',
      status: 'Programada',
      actualStartTime: null,
      actualEndTime: null,
      duration: null,
      cost: 0,
      complications: null,
      postOpDiagnosis: null,
      bloodLoss: null,
      recoveryTime: null,
      dischargeDate: null
    };

    onSave(surgeryData);
    setIsLoading(false);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      patientId: '',
      surgeryDate: new Date().toISOString().split('T')[0],
      scheduledTime: '',
      surgeryType: '',
      surgeon: '',
      anesthesiologist: '',
      nurse: '',
      operatingRoom: '',
      preOpDiagnosis: '',
      anesthesia: '',
      estimatedDuration: '',
      notes: '',
      specialInstructions: ''
    });
    setSelectedPatient(null);
    setSearchTerm('');
    setShowPatientSearch(false);
    setErrors({});
    onClose();
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50">
          <Dialog.Title className="flex items-center p-6 pb-4 text-lg font-semibold">
            <Zap className="h-5 w-5 mr-2 text-[#2E9589]" />
            Programar Cirugía
          </Dialog.Title>
          <Dialog.Description className="px-6 pb-4 text-gray-600">
            Complete la información para programar una nueva cirugía
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
            {/* Selección de Paciente */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Selección de Paciente</h3>
              
              <div className="space-y-2">
                <Label htmlFor="patientSearch">Buscar Paciente *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="patientSearch"
                    placeholder="Buscar por nombre o número de identidad..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowPatientSearch(true);
                    }}
                    onFocus={() => setShowPatientSearch(true)}
                    className={`pl-10 ${errors.patient ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.patient && <p className="text-red-500 text-sm mt-1">{errors.patient}</p>}
                
                {showPatientSearch && searchTerm && (
                  <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto bg-white shadow-lg z-10">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="flex items-center space-x-3">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">
                                {patient.name} {patient.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {patient.identityNumber} • {patient.gender} • {calculateAge(patient.birthDate)} años
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No se encontraron pacientes
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedPatient && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Paciente Seleccionado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Nombre:</span>
                      <span className="ml-2 text-gray-900">{selectedPatient.name} {selectedPatient.lastName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Identidad:</span>
                      <span className="ml-2 text-gray-900">{selectedPatient.identityNumber}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Teléfono:</span>
                      <span className="ml-2 text-gray-900">{selectedPatient.phone}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Edad:</span>
                      <span className="ml-2 text-gray-900">{calculateAge(selectedPatient.birthDate)} años</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Información de la Cirugía */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información de la Cirugía</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surgeryDate">Fecha de Cirugía</Label>
                  <Input
                    id="surgeryDate"
                    name="surgeryDate"
                    type="date"
                    value={formData.surgeryDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Hora Programada *</Label>
                  <Select.Root value={formData.scheduledTime} onValueChange={(value) => setFormData(prev => ({ ...prev, scheduledTime: value }))}>
                    <Select.Trigger className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.scheduledTime ? 'border-red-500' : ''}`}>
                      <Select.Value placeholder="Seleccionar hora" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {TIME_SLOTS.map((time) => (
                            <Select.Item key={time} value={time} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{time}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  {errors.scheduledTime && <p className="text-red-500 text-sm mt-1">{errors.scheduledTime}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surgeryType">Tipo de Cirugía *</Label>
                  <Select.Root value={formData.surgeryType} onValueChange={(value) => setFormData(prev => ({ ...prev, surgeryType: value }))}>
                    <Select.Trigger className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.surgeryType ? 'border-red-500' : ''}`}>
                      <Select.Value placeholder="Seleccionar tipo de cirugía" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {SURGERY_TYPES.map((type) => (
                            <Select.Item key={type} value={type} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{type}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  {errors.surgeryType && <p className="text-red-500 text-sm mt-1">{errors.surgeryType}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingRoom">Quirófano</Label>
                  <Select.Root value={formData.operatingRoom} onValueChange={(value) => setFormData(prev => ({ ...prev, operatingRoom: value }))}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="Seleccionar quirófano" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {OPERATING_ROOMS.map((room) => (
                            <Select.Item key={room.id} value={room.name} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{room.name} - {room.type} (Piso {room.floor})</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              </div>
            </div>

            {/* Equipo Quirúrgico */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Equipo Quirúrgico</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surgeon">Cirujano Principal *</Label>
                  <Select.Root value={formData.surgeon} onValueChange={(value) => setFormData(prev => ({ ...prev, surgeon: value }))}>
                    <Select.Trigger className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.surgeon ? 'border-red-500' : ''}`}>
                      <Select.Value placeholder="Seleccionar cirujano" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {SURGEONS.map((surgeon) => (
                            <Select.Item key={surgeon} value={surgeon} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{surgeon}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  {errors.surgeon && <p className="text-red-500 text-sm mt-1">{errors.surgeon}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anesthesiologist">Anestesiólogo</Label>
                  <Select.Root value={formData.anesthesiologist} onValueChange={(value) => setFormData(prev => ({ ...prev, anesthesiologist: value }))}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="Seleccionar anestesiólogo" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {ANESTHESIOLOGISTS.map((anesthesiologist) => (
                            <Select.Item key={anesthesiologist} value={anesthesiologist} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{anesthesiologist}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nurse">Enfermero Circulante</Label>
                  <Select.Root value={formData.nurse} onValueChange={(value) => setFormData(prev => ({ ...prev, nurse: value }))}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="Seleccionar enfermero" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {NURSES.map((nurse) => (
                            <Select.Item key={nurse} value={nurse} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{nurse}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              </div>
            </div>

            {/* Diagnóstico y Anestesia */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Diagnóstico y Anestesia</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preOpDiagnosis">Diagnóstico Pre-operatorio *</Label>
                  <Input
                    id="preOpDiagnosis"
                    name="preOpDiagnosis"
                    value={formData.preOpDiagnosis}
                    onChange={handleInputChange}
                    placeholder="Diagnóstico que justifica la cirugía..."
                    className={errors.preOpDiagnosis ? 'border-red-500' : ''}
                  />
                  {errors.preOpDiagnosis && <p className="text-red-500 text-sm mt-1">{errors.preOpDiagnosis}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="anesthesia">Tipo de Anestesia</Label>
                  <Select.Root value={formData.anesthesia} onValueChange={(value) => setFormData(prev => ({ ...prev, anesthesia: value }))}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="Seleccionar tipo de anestesia" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {ANESTHESIA_TYPES.map((type) => (
                            <Select.Item key={type} value={type} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{type}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Duración Estimada (horas)</Label>
                <Input
                  id="estimatedDuration"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  placeholder="2.5"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                />
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información Adicional</h3>
              
              <div className="space-y-2">
                <Label htmlFor="specialInstructions">Instrucciones Especiales</Label>
                <textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleInputChange}
                  placeholder="Instrucciones especiales para el equipo quirúrgico..."
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Observaciones adicionales sobre la cirugía..."
                  className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={2}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Programando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Programar Cirugía
                  </>
                )}
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