"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Calendar,
  PlusCircle,
  Building2,
  Scissors,
  UserPlus,
  CalendarPlus,
  Stethoscope,
  Activity,
  ArrowRight,
  Bed,
  Edit2,
  Save,
  X,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { ReceptionStats } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';
import { PatientModal } from '@/components/PatientModal';
import AppointmentModal from '@/components/AppointmentModal';
import HospitalizationModal from '@/components/HospitalizationModal';
import SurgeryModal from '@/components/SurgeryModal';
import { useRouter } from 'next/navigation';
import { Specialty } from '@/types/appointments';
import { MedicationName } from '@/types/medications';
import { InlineSpinner } from '@/components/ui/spinner';

export function ReceptionDashboard() {
  const [stats, setStats] = useState<ReceptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Estados para modales
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showHospitalizationModal, setShowHospitalizationModal] = useState(false);
  const [showSurgeryModal, setShowSurgeryModal] = useState(false);

  // Catálogo de medicamentos
  const [medications, setMedications] = useState<MedicationName[]>([]);
  const [medicationsLoading, setMedicationsLoading] = useState(true);
  const [newMedicationName, setNewMedicationName] = useState('');
  const [creatingMedication, setCreatingMedication] = useState(false);
  const [editingMedicationId, setEditingMedicationId] = useState<string | null>(null);
  const [editingMedicationName, setEditingMedicationName] = useState('');
  const [updatingMedicationId, setUpdatingMedicationId] = useState<string | null>(null);
  const [deletingMedicationId, setDeletingMedicationId] = useState<string | null>(null);

  // Estado para especialidades (necesario para AppointmentModal)
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  useEffect(() => {
    loadStats();
    loadSpecialties();
    loadMedicationNames();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/reception');
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSpecialties = async () => {
    try {
      const response = await fetch('/api/specialties');
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data.specialties || []);
      }
    } catch (error) {
      console.error('Error loading specialties:', error);
    }
  };

  const loadMedicationNames = async () => {
    try {
      setMedicationsLoading(true);
      const response = await fetch('/api/medication-names');
      if (!response.ok) throw new Error('Error al cargar medicamentos');
      const data = await response.json();
      setMedications(data.medications || []);
    } catch (error) {
      console.error('Error loading medication names:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los nombres de medicamentos',
        variant: 'error',
      });
    } finally {
      setMedicationsLoading(false);
    }
  };

  const handleCreateMedication = async () => {
    const trimmed = newMedicationName.trim();
    if (!trimmed) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingrese un nombre de medicamento',
        variant: 'error',
      });
      return;
    }

    try {
      setCreatingMedication(true);
      const response = await fetch('/api/medication-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'No se pudo crear el medicamento');
      }

      setNewMedicationName('');
      loadMedicationNames();
      toast({
        title: 'Nombre agregado',
        description: 'El medicamento se ha registrado correctamente',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo registrar el medicamento',
        variant: 'error',
      });
    } finally {
      setCreatingMedication(false);
    }
  };

  const startEditingMedication = (medication: MedicationName) => {
    setEditingMedicationId(medication.id);
    setEditingMedicationName(medication.name);
  };

  const cancelEditingMedication = () => {
    setEditingMedicationId(null);
    setEditingMedicationName('');
    setUpdatingMedicationId(null);
  };

  const handleUpdateMedication = async (id: string) => {
    const trimmed = editingMedicationName.trim();
    if (!trimmed) {
      toast({
        title: 'Nombre requerido',
        description: 'Ingrese un nombre de medicamento',
        variant: 'error',
      });
      return;
    }

    try {
      setUpdatingMedicationId(id);
      const response = await fetch(`/api/medication-names/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'No se pudo actualizar el medicamento');
      }

      cancelEditingMedication();
      loadMedicationNames();
      toast({
        title: 'Nombre actualizado',
        description: 'El nombre del medicamento se actualizó correctamente',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el medicamento',
        variant: 'error',
      });
    } finally {
      setUpdatingMedicationId(null);
    }
  };

  const handleDeleteMedication = async (id: string) => {
    try {
      setDeletingMedicationId(id);
      const response = await fetch(`/api/medication-names/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'No se pudo eliminar el medicamento');
      }

      if (editingMedicationId === id) {
        cancelEditingMedication();
      }
      loadMedicationNames();
      toast({
        title: 'Nombre eliminado',
        description: 'El medicamento se ha eliminado del catálogo',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el medicamento',
        variant: 'error',
      });
    } finally {
      setDeletingMedicationId(null);
    }
  };

  const handleModalSuccess = () => {
    loadStats(); // Recargar estadísticas
    toast({
      title: 'Éxito',
      description: 'Operación completada correctamente',
      variant: 'success',
    });
  };

  const handleAppointmentSave = async (data: unknown) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear la cita');
      }

      setShowAppointmentModal(false);
      handleModalSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la cita',
        variant: 'error',
      });
      throw error;
    }
  };

  const handlePatientSave = async (data: unknown) => {
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear el paciente');
      }

      setShowPatientModal(false);
      handleModalSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el paciente',
        variant: 'error',
      });
      throw error;
    }
  };

  const handleHospitalizationSave = async (data: unknown) => {
    try {
      const response = await fetch('/api/hospitalizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al crear la hospitalización');
      }

      setShowHospitalizationModal(false);
      handleModalSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la hospitalización',
        variant: 'error',
      });
      throw error;
    }
  };

  const handleSurgerySave = async () => {
    setShowSurgeryModal(false);
    handleModalSuccess();
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E9589]"></div>
      </div>
    );
  }

  const mainActions = [
    {
      title: 'Nuevo Paciente',
      description: 'Registrar un nuevo paciente',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => setShowPatientModal(true),
    },
    {
      title: 'Nueva Cita',
      description: 'Agendar una cita médica',
      icon: CalendarPlus,
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => setShowAppointmentModal(true),
    },
    {
      title: 'Nueva Hospitalización',
      description: 'Iniciar hospitalización',
      icon: Bed,
      color: 'bg-[#2E9589] hover:bg-[#2E9589]/90',
      onClick: () => setShowHospitalizationModal(true),
    },
    {
      title: 'Nueva Cirugía',
      description: 'Registrar cirugía',
      icon: Scissors,
      color: 'bg-red-500 hover:bg-red-600',
      onClick: () => setShowSurgeryModal(true),
    },
  ];

  const quickLinks = [
    {
      title: 'Pacientes',
      description: 'Ver todos los pacientes',
      icon: Users,
      href: '/patients',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Citas',
      description: 'Gestionar citas',
      icon: Calendar,
      href: '/appointments',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Hospitalizaciones',
      description: 'Ver hospitalizaciones',
      icon: Building2,
      href: '/hospitalizaciones',
      color: 'text-[#2E9589]',
      bgColor: 'bg-[#2E9589]/10',
    },
    {
      title: 'Cirugías',
      description: 'Ver cirugías',
      icon: Scissors,
      href: '/surgeries',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      programado: { label: 'Programado', color: 'bg-blue-100 text-blue-800' },
      pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      completado: { label: 'Completado', color: 'bg-green-100 text-green-800' },
      cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Recepción
          </h1>
          <p className="text-gray-600">
            Centro de gestión y acciones rápidas
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Citas Hoy</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.appointmentsToday.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pacientes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.patients.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    +{stats.patients.newThisMonth} este mes
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hospitalizados</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.activeHospitalizations.length}
                  </p>
                </div>
                <div className="p-3 bg-[#2E9589]/10 rounded-full">
                  <Bed className="h-6 w-6 text-[#2E9589]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Próximas Citas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.upcomingAppointments.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Esta semana</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Acciones Principales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mainActions.map((action, index) => (
              <Button
                key={index}
                onClick={action.onClick}
                className={`${action.color} text-white h-auto py-6 flex flex-col items-center justify-center space-y-2 shadow-md hover:shadow-lg transition-all`}
              >
                <action.icon className="h-8 w-8" />
                <div className="text-center">
                  <div className="font-semibold text-lg">{action.title}</div>
                  <div className="text-xs opacity-90">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Link key={index} href={link.href}>
                <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-105 bg-white border-gray-200 h-full">
                  <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 ${link.bgColor} rounded-full`}>
                      <link.icon className={`h-6 w-6 ${link.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{link.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Citas del Día */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Citas del Día
                </CardTitle>
                <Link href="/appointments">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    Ver todas
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {stats.appointmentsToday.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No hay citas programadas para hoy</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.appointmentsToday.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {appointment.patient}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {appointment.specialty}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(appointment.time).toLocaleTimeString('es-HN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hospitalizaciones Activas */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bed className="h-5 w-5 text-[#2E9589]" />
                  Hospitalizaciones Activas
                </CardTitle>
                <Link href="/hospitalizaciones">
                  <Button variant="ghost" size="sm" className="text-[#2E9589] hover:text-[#2E9589]/80">
                    Ver todas
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {stats.activeHospitalizations.length === 0 ? (
                <div className="text-center py-8">
                  <Bed className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No hay hospitalizaciones activas</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stats.activeHospitalizations.map((hospitalization) => (
                    <div
                      key={hospitalization.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/hospitalizaciones/${hospitalization.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {hospitalization.patient}
                          </p>
                          <p className="text-xs text-gray-500">
                            {hospitalization.identityNumber}
                          </p>
                        </div>
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-[#2E9589]/10 text-[#2E9589] rounded-full whitespace-nowrap">
                          {hospitalization.room}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {hospitalization.doctor}
                        </span>
                        <span>
                          {new Date(hospitalization.admissionDate).toLocaleDateString('es-HN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Próximas Citas de la Semana */}
        <Card className="bg-white border-gray-200 mt-6">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Próximas Citas de la Semana
              </CardTitle>
              <Link href="/appointments">
                <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                  Ver todas
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {stats.upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No hay citas próximas esta semana</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.upcomingAppointments.slice(0, 9).map((appointment, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 flex-1">
                        {appointment.patient}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {appointment.specialty}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium">
                        {new Date(appointment.date).toLocaleDateString('es-HN', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                      <span>
                        {new Date(appointment.time).toLocaleTimeString('es-HN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Catálogo de Medicamentos */}
        <Card className="bg-white border-gray-200 mt-6">
          <CardHeader className="border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-[#2E9589]" />
                Catálogo de Medicamentos
              </CardTitle>
              <div className="flex w-full md:w-auto gap-2">
                <Input
                  value={newMedicationName}
                  onChange={(e) => setNewMedicationName(e.target.value)}
                  placeholder="Nombre de medicamento"
                  className="flex-1"
                />
                <Button
                  onClick={handleCreateMedication}
                  disabled={creatingMedication}
                  className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                  {creatingMedication ? <InlineSpinner size="sm" className="mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
                  Agregar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {medicationsLoading ? (
              <div className="flex items-center justify-center py-10">
                <InlineSpinner />
              </div>
            ) : medications.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-500">No hay medicamentos registrados. Agregue uno con el formulario superior.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {medications.map((medication) => {
                  const isEditing = editingMedicationId === medication.id;
                  const isUpdating = updatingMedicationId === medication.id;
                  const isDeleting = deletingMedicationId === medication.id;

                  return (
                    <div
                      key={medication.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <Input
                            value={editingMedicationName}
                            onChange={(e) => setEditingMedicationName(e.target.value)}
                            autoFocus
                          />
                        ) : (
                          <p className="text-sm font-medium text-gray-900 truncate">{medication.name}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Registrado el {new Date(medication.createdAt).toLocaleDateString('es-HN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateMedication(medication.id)}
                              disabled={isUpdating}
                              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                            >
                              {isUpdating ? <InlineSpinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingMedication}
                              disabled={isUpdating}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditingMedication(medication)}
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteMedication(medication.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? <InlineSpinner size="sm" className="mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <PatientModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onSave={handlePatientSave}
      />
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSave={handleAppointmentSave}
        specialties={specialties}
      />
      <HospitalizationModal
        isOpen={showHospitalizationModal}
        onClose={() => setShowHospitalizationModal(false)}
        onSave={handleHospitalizationSave}
      />
      <SurgeryModal
        isOpen={showSurgeryModal}
        onClose={() => setShowSurgeryModal(false)}
        onSave={handleSurgerySave}
      />
    </>
  );
}
