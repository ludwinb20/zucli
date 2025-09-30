'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Plus, 
  Search, 
  Eye, 
  Calendar,
  UserPlus,
  Stethoscope
} from 'lucide-react';
import { PatientModal } from '@/components/PatientModal';
import { VisitModal } from '@/components/VisitModal';

// Datos dummy para pacientes
const DUMMY_PATIENTS = [
  {
    id: '1',
    name: 'María González',
    lastName: 'López',
    birthDate: '1985-03-15',
    identityNumber: '0801-1985-12345',
    gender: 'Femenino',
    phone: '9876-5432',
    email: 'maria.gonzalez@email.com',
    address: 'Col. Las Flores, Tegucigalpa',
    visits: [
      {
        id: '1',
        date: '2024-01-15',
        diagnosis: 'Hipertensión arterial',
        currentIllness: 'Dolor de cabeza persistente',
        vitalSigns: {
          bloodPressure: '140/90',
          heartRate: '85',
          temperature: '36.5°C',
          weight: '65kg',
          height: '165cm'
        }
      }
    ]
  },
  {
    id: '2',
    name: 'Juan',
    lastName: 'Pérez',
    birthDate: '1978-07-22',
    identityNumber: '0801-1978-67890',
    gender: 'Masculino',
    phone: '8765-4321',
    email: 'juan.perez@email.com',
    address: 'Col. Residencial, San Pedro Sula',
    visits: []
  },
  {
    id: '3',
    name: 'Ana',
    lastName: 'Martínez',
    birthDate: '1992-11-08',
    identityNumber: '0801-1992-11111',
    gender: 'Femenino',
    phone: '7654-3210',
    email: 'ana.martinez@email.com',
    address: 'Col. Centro, La Ceiba',
    visits: [
      {
        id: '2',
        date: '2024-01-10',
        diagnosis: 'Gripe común',
        currentIllness: 'Fiebre y malestar general',
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: '95',
          temperature: '38.2°C',
          weight: '58kg',
          height: '160cm'
        }
      }
    ]
  }
];

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState(DUMMY_PATIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const filteredPatients = patients.filter(patient =>
    `${patient.name} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.identityNumber.includes(searchTerm)
  );

  const handleAddPatient = (newPatient: any) => {
    setPatients([...patients, { ...newPatient, id: Date.now().toString(), visits: [] }]);
    setIsPatientModalOpen(false);
  };

  const handleAddVisit = (visitData: any) => {
    const updatedPatients = patients.map(patient => {
      if (patient.id === selectedPatient.id) {
        return {
          ...patient,
          visits: [...patient.visits, { ...visitData, id: Date.now().toString() }]
        };
      }
      return patient;
    });
    setPatients(updatedPatients);
    setIsVisitModalOpen(false);
    setSelectedPatient(null);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gestión de Pacientes
          </h2>
          <p className="text-gray-600">
            Administra la información de pacientes y sus visitas médicas
          </p>
        </div>

        {/* Search and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o número de identidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            onClick={() => setIsPatientModalOpen(true)}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Paciente
          </Button>
        </div>

        {/* Patients List */}
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="bg-transparent border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-[#2E9589]/10 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-[#2E9589]" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {patient.name} {patient.lastName}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Identidad:</span> {patient.identityNumber}
                          </div>
                          <div>
                            <span className="font-medium">Teléfono:</span> {patient.phone}
                          </div>
                          <div>
                            <span className="font-medium">Edad:</span> {new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} años
                          </div>
                          <div>
                            <span className="font-medium">Visitas:</span> {patient.visits.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setIsVisitModalOpen(true);
                      }}
                      className="text-[#2E9589] border-[#2E9589] hover:bg-[#2E9589] hover:text-white"
                    >
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Nueva Visita
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
                
                {/* Recent Visits */}
                {patient.visits.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Últimas Visitas:</h4>
                    <div className="space-y-2">
                      {patient.visits.slice(0, 2).map((visit) => (
                        <div key={visit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{visit.diagnosis}</p>
                            <p className="text-xs text-gray-600">{visit.currentIllness}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(visit.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPatients.length === 0 && (
          <Card className="bg-transparent border-gray-200">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron pacientes
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer paciente'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setIsPatientModalOpen(true)}
                  className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Paciente
                </Button>
              )}
            </CardContent>
          </Card>
        )}

      {/* Modals */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSave={handleAddPatient}
      />
      
      <VisitModal
        isOpen={isVisitModalOpen}
        onClose={() => {
          setIsVisitModalOpen(false);
          setSelectedPatient(null);
        }}
        onSave={handleAddVisit}
        patient={selectedPatient}
      />
    </div>
  );
}
