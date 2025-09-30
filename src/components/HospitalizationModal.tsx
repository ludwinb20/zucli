'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { 
  CalendarIcon, 
  Search, 
  User, 
  Bed, 
  Stethoscope,
  Clock,
  AlertCircle,
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

interface HospitalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (hospitalizationData: any) => void;
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

const ROOMS = [
  { id: '101', name: 'Habitación 101', type: 'Individual', floor: '1' },
  { id: '102', name: 'Habitación 102', type: 'Individual', floor: '1' },
  { id: '103', name: 'Habitación 103', type: 'Doble', floor: '1' },
  { id: '201', name: 'Habitación 201', type: 'Individual', floor: '2' },
  { id: '202', name: 'Habitación 202', type: 'Individual', floor: '2' },
  { id: '203', name: 'Habitación 203', type: 'Doble', floor: '2' },
  { id: '301', name: 'Habitación 301', type: 'Individual', floor: '3' },
  { id: '302', name: 'Habitación 302', type: 'Individual', floor: '3' },
  { id: '303', name: 'Habitación 303', type: 'Doble', floor: '3' }
];

const BEDS = ['Cama A', 'Cama B'];

const DOCTORS = [
  'Dr. Carlos Mendoza',
  'Dr. Ana Rodríguez',
  'Dr. Luis Herrera',
  'Dr. Roberto Díaz',
  'Dr. Elena Morales',
  'Dr. Carmen Vega'
];

export function HospitalizationModal({ isOpen, onClose, onSave }: HospitalizationModalProps) {
  const [formData, setFormData] = useState({
    patientId: '',
    admissionDate: new Date().toISOString().split('T')[0],
    room: '',
    bed: '',
    diagnosis: '',
    doctor: '',
    admissionReason: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      oxygenSaturation: '',
      weight: '',
      height: ''
    },
    allergies: '',
    medications: '',
    notes: ''
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
    if (!formData.diagnosis.trim()) newErrors.diagnosis = 'El diagnóstico es requerido';
    if (!formData.doctor) newErrors.doctor = 'El médico tratante es requerido';
    if (!formData.admissionReason.trim()) newErrors.admissionReason = 'El motivo de ingreso es requerido';

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

    const hospitalizationData = {
      ...formData,
      patientName: selectedPatient ? `${selectedPatient.name} ${selectedPatient.lastName}` : '',
      patientId: selectedPatient?.identityNumber || '',
      status: 'Activa',
      totalCost: 0,
      charges: [],
      dischargeDate: null
    };

    onSave(hospitalizationData);
    setIsLoading(false);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      patientId: '',
      admissionDate: new Date().toISOString().split('T')[0],
      room: '',
      bed: '',
      diagnosis: '',
      doctor: '',
      admissionReason: '',
      vitalSigns: {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        oxygenSaturation: '',
        weight: '',
        height: ''
      },
      allergies: '',
      medications: '',
      notes: ''
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
            <Bed className="h-5 w-5 mr-2 text-[#2E9589]" />
            Nueva Hospitalización
          </Dialog.Title>
          <Dialog.Description className="px-6 pb-4 text-gray-600">
            Complete la información para registrar una nueva hospitalización
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

            {/* Información de Hospitalización */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información de Hospitalización</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="admissionDate">Fecha de Ingreso</Label>
                  <Input
                    id="admissionDate"
                    name="admissionDate"
                    type="date"
                    value={formData.admissionDate}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="room">Habitación</Label>
                  <Select.Root value={formData.room} onValueChange={(value) => setFormData(prev => ({ ...prev, room: value }))}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="Seleccionar habitación" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {ROOMS.map((room) => (
                            <Select.Item key={room.id} value={room.name} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{room.name} - {room.type} (Piso {room.floor})</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bed">Cama</Label>
                  <Select.Root value={formData.bed} onValueChange={(value) => setFormData(prev => ({ ...prev, bed: value }))}>
                    <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <Select.Value placeholder="Seleccionar cama" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {BEDS.map((bed) => (
                            <Select.Item key={bed} value={bed} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{bed}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="doctor">Médico Tratante *</Label>
                  <Select.Root value={formData.doctor} onValueChange={(value) => setFormData(prev => ({ ...prev, doctor: value }))}>
                    <Select.Trigger className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.doctor ? 'border-red-500' : ''}`}>
                      <Select.Value placeholder="Seleccionar médico" />
                      <Select.Icon asChild>
                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-gray-950 shadow-md">
                        <Select.Viewport className="p-1">
                          {DOCTORS.map((doctor) => (
                            <Select.Item key={doctor} value={doctor} className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                              <Select.ItemText>{doctor}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                  {errors.doctor && <p className="text-red-500 text-sm mt-1">{errors.doctor}</p>}
                </div>
              </div>
            </div>

            {/* Diagnóstico y Motivo */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Diagnóstico y Motivo</h3>
              
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnóstico Principal *</Label>
                <Input
                  id="diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  placeholder="Diagnóstico médico..."
                  className={errors.diagnosis ? 'border-red-500' : ''}
                />
                {errors.diagnosis && <p className="text-red-500 text-sm mt-1">{errors.diagnosis}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admissionReason">Motivo de Ingreso *</Label>
                <textarea
                  id="admissionReason"
                  name="admissionReason"
                  value={formData.admissionReason}
                  onChange={handleInputChange}
                  placeholder="Descripción del motivo de hospitalización..."
                  className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${errors.admissionReason ? 'border-red-500' : ''}`}
                  rows={3}
                />
                {errors.admissionReason && <p className="text-red-500 text-sm mt-1">{errors.admissionReason}</p>}
              </div>
            </div>

            {/* Signos Vitales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Signos Vitales Iniciales</h3>
              
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
                  <Label htmlFor="oxygenSaturation">Saturación de Oxígeno</Label>
                  <Input
                    id="oxygenSaturation"
                    name="oxygenSaturation"
                    value={formData.vitalSigns.oxygenSaturation}
                    onChange={handleVitalSignsChange}
                    placeholder="98%"
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

            {/* Información Adicional */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Información Adicional</h3>
              
              <div className="space-y-2">
                <Label htmlFor="allergies">Alergias Conocidas</Label>
                <Input
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="Penicilina, Aspirina, etc. (dejar vacío si no hay alergias)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications">Medicamentos Actuales</Label>
                <textarea
                  id="medications"
                  name="medications"
                  value={formData.medications}
                  onChange={handleInputChange}
                  placeholder="Medicamentos que el paciente está tomando actualmente..."
                  className="flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionales</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Observaciones adicionales sobre el paciente..."
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
                    Guardando...
                  </>
                ) : (
                  <>
                    <Bed className="h-4 w-4 mr-2" />
                    Registrar Hospitalización
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