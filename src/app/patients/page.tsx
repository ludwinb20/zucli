'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, MoreHorizontal, Edit, Trash2, User, CalendarDays, UserRound, Calendar, ChevronLeft, ChevronRight, Phone, FileText, AlertTriangle } from 'lucide-react';
import { PatientModal } from '@/components/PatientModal';
import { medicalToasts } from '@/lib/toast';
import { Patient, PaginationInfo } from '@/types';


export default function PatientsPage() {
  const { } = useAuth();
  const { } = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  const fetchPatients = useCallback(async (isSearch = false) => {
    setLoading(true);
    try {
      // Si es una búsqueda nueva, volver a la página 1
      if (isSearch) {
        setCurrentPage(1);
      }
      
      const page = isSearch ? 1 : currentPage;
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '100',
        ...(searchTerm && { search: searchTerm }),
      });
      
      const response = await fetch(`/api/patients?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const data = await response.json();
      setPatients(data.patients);
      setPaginationInfo(data.pagination);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchPatients(false); // No es una búsqueda nueva
  }, [currentPage, fetchPatients]);

  // Debounce search para evitar demasiadas consultas
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    const timeout = setTimeout(() => {
      fetchPatients(true); // Indicar que es una búsqueda
    }, 500); // Esperar 500ms después del último keystroke
    
    setSearchDebounce(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, fetchPatients]);

  const handleCreatePatient = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const handleSavePatient = async () => {
    await fetchPatients();
    setIsModalOpen(false);
  };

  // Funciones de paginación
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (paginationInfo?.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (paginationInfo?.hasPreviousPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleDeletePatient = (patient: Patient) => {
    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;

    try {
      const response = await fetch(`/api/patients/${patientToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        medicalToasts.patientDeleted(`${patientToDelete.firstName} ${patientToDelete.lastName}`);
        setPatients(patients.filter((p) => p.id !== patientToDelete.id));
        setIsDeleteDialogOpen(false);
        setPatientToDelete(null);
      } else {
        medicalToasts.patientError('eliminar');
      }
    } catch (error) {
      console.error("Error deleting patient:", error);
      medicalToasts.networkError();
    }
  };

  const getGenderBadgeVariant = (gender: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      Masculino: "default",
      Femenino: "secondary"
    };
    return variants[gender] || "default";
  };

  const getGenderBadgeStyles = (gender: string) => {
    if (gender === "Femenino") {
      return "bg-pink-100 text-pink-800 border-pink-200";
    }
    if (gender === "Masculino") {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getGenderDisplayName = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'masculino':
        return 'Masculino';
      case 'femenino':
        return 'Femenino';
      case 'otro':
        return 'Otro';
      default:
        return gender;
    }
  };

  const formatBirthDate = (birthDate: string) => {
    try {
      console.log('Frontend received birthDate:', birthDate, 'Type:', typeof birthDate);
      const date = new Date(birthDate + 'T00:00:00'); // Fuerza medianoche local
      console.log('Parsed date object:', date);
      
      // Formatear en timezone de Honduras
      const result = date.toLocaleDateString('es-HN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'America/Tegucigalpa'
      });
      console.log('Frontend formatted result:', result);
      return result;
    } catch (error) {
      console.error('Frontend date formatting error:', error, birthDate);
      return 'Fecha inválida';
    }
  };

  const calculateAge = (birthDate: string) => {
    try {
      const date = new Date(birthDate + 'T00:00:00');
      const today = new Date();
      
      let age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      
      return Math.max(0, age);
    } catch {
      return 0;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Gestión de Pacientes
          </h2>
          <p className="text-gray-600">
              Registra y administra los pacientes del sistema
            </p>
          </div>
          <Button
            onClick={handleCreatePatient}
            className="flex items-center space-x-2 bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Paciente</span>
          </Button>
        </div>
        </div>

      {/* Patients List */}
      <Card className="bg-transparent border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Lista de Pacientes</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar pacientes por nombre o número de identidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E9589]"></div>
                <p className="text-gray-600 text-sm">Cargando pacientes...</p>
              </div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No se encontraron pacientes</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay pacientes registrados en el sistema'}
              </p>
        </div>
          ) : (
            <>
        <div className="grid gap-4">
                {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                    <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#2E9589] text-white rounded-full flex items-center justify-center">
                      <User className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-gray-900 text-lg">
                          {patient.firstName} {patient.lastName}
                        </h3>
                        <Badge
                          variant={getGenderBadgeVariant(patient.gender)}
                          className={`text-xs ${getGenderBadgeStyles(patient.gender)}`}
                        >
                          {getGenderDisplayName(patient.gender)}
                        </Badge>
                          </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <CalendarDays className="h-4 w-4" />
                          <span>Nacido: {formatBirthDate(patient.birthDate)} ({calculateAge(patient.birthDate)} años)</span>
                          </div>
                        <div className="flex items-center space-x-1">
                          <UserRound className="h-4 w-4" />
                          <span>ID: {patient.identityNumber}</span>
                          </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Registrado: {new Date(patient.createdAt).toLocaleDateString()}</span>
                          </div>
                        {patient.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-4 w-4" />
                            <span>Tel: {patient.phone}</span>
                          </div>
                        )}
                        </div>
                        
                        {/* Contacto de Emergencia */}
                        {(patient.emergencyContactName || patient.emergencyContactNumber) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center space-x-1 text-sm">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-600 font-medium">Contacto de Emergencia:</span>
                              <span className="text-gray-800">
                                {patient.emergencyContactName}
                                {patient.emergencyContactNumber && ` - ${patient.emergencyContactNumber}`}
                                {patient.emergencyContactRelation && ` (${patient.emergencyContactRelation})`}
                              </span>
                            </div>
                          </div>
                        )}
                      {(patient.medicalHistory || patient.allergies) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="space-y-1 text-sm">
                            {patient.medicalHistory && (
                              <div className="flex items-start space-x-1">
                                <FileText size={16} className="text-gray-500 mt-0.5" />
                                <span className="text-gray-600 font-medium">Enfermedades base:</span>
                                <span className="text-gray-800">{patient.medicalHistory}</span>
                          </div>
                            )}
                            {patient.allergies && (
                              <div className="flex items-start space-x-1">
                                <AlertTriangle size={16} className="text-red-500 mt-0.5" />
                                <span className="text-gray-600 font-medium">Alergias:</span>
                                <span className="text-gray-800">{patient.allergies}</span>
                          </div>
                            )}
                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-gray-200"
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={() => handleEditPatient(patient)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Paciente
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeletePatient(patient)}
                        className="text-red-600 cursor-pointer focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Paciente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                        </div>
                  ))}
                </div>
                
                {/* Controles de Paginación */}
                {paginationInfo && paginationInfo.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 px-4 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Mostrando {((currentPage - 1) * paginationInfo.limit) + 1} - {Math.min(currentPage * paginationInfo.limit, paginationInfo.totalCount)} de {paginationInfo.totalCount} pacientes
                  </div>
                    
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                        onClick={goToPreviousPage}
                        disabled={!paginationInfo.hasPreviousPage}
                        className="flex items-center space-x-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Anterior</span>
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(paginationInfo.totalPages, 5) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(paginationInfo.totalPages - 4, paginationInfo.currentPage - 2)) + i;
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === paginationInfo.currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="min-w-[40px]"
                            >
                              {pageNum}
                    </Button>
                          );
                        })}
                      </div>
                      
                    <Button
                      variant="outline"
                      size="sm"
                        onClick={goToNextPage}
                        disabled={!paginationInfo.hasNextPage}
                        className="flex items-center space-x-1"
                    >
                        <span>Siguiente</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    </div>
                  </div>
                )}
              </>
              )}
            </CardContent>
          </Card>

      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePatient}
        patient={editingPatient}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente al paciente{' '}
              <strong>{patientToDelete?.firstName} {patientToDelete?.lastName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePatient}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
