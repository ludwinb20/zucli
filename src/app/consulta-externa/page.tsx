"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SpinnerWithText } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Calendar,
  User,
  Phone,
  Stethoscope,
  Eye,
  RefreshCw,
  Plus,
  X,
} from "lucide-react";
import {
  Appointment,
  Specialty,
  AppointmentStatus,
} from "@/types/appointments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import NuevaConsultaDirectaModal from "@/components/NuevaConsultaDirectaModal";
import ChangeStatusModal from "@/components/ChangeStatusModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConsultaExternaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [isNuevaConsultaModalOpen, setIsNuevaConsultaModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [changeStatusModalOpen, setChangeStatusModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Construir parámetros de búsqueda
      const params = new URLSearchParams({
        status: 'pendiente', // Solo citas pendientes
        limit: '100'
      });

      // Si el usuario es especialista, filtrar por su especialidad
      if (user?.role?.name === 'especialista' && user.specialty?.id) {
        console.log('specialtyId', user);
        params.append('specialtyId', user.specialty.id);
      }

      // Cargar citas pendientes
      const appointmentsResponse = await fetch(`/api/appointments?${params.toString()}`);
      if (appointmentsResponse.ok) {
        const data = await appointmentsResponse.json();
        let appointments = data.appointments || data;
        
        // Si el usuario es especialista, filtrar para mostrar solo:
        // - Citas con su doctorId
        // - Citas de su especialidad con doctorId null
        if (user?.role?.name === 'especialista' && user.id && user.specialty?.id) {
          const specialtyId = user.specialty.id;
          appointments = appointments.filter((apt: Appointment) => {
            return apt.doctorId === user.id || 
                   (apt.specialtyId === specialtyId && !apt.doctorId);
          });
        }
        
        setAppointments(appointments);
      }

      // Si es admin, cargar todas las especialidades para el filtro
      if (user?.role?.name === 'admin') {
        const specialtiesResponse = await fetch('/api/specialties');
        if (specialtiesResponse.ok) {
          const specialtiesData = await specialtiesResponse.json();
          setSpecialties(specialtiesData.specialties || []);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Proteger acceso - recepcion no debe tener acceso
  useEffect(() => {
    if (user && user.role?.name === 'recepcion') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user && user.role?.name !== 'recepcion') {
      loadData();
    }
  }, [loadData, user]);

  // Filtrar citas localmente (búsqueda por texto y especialidad)
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patient.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.patient.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.patient.identityNumber.includes(searchTerm);

    const matchesSpecialty =
      specialtyFilter === "all" || appointment.specialtyId === specialtyFilter;

    return matchesSearch && matchesSpecialty;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pendiente":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStartConsultation = (appointment: Appointment) => {
    // Navegar a la página de detalle de consulta
    router.push(`/consulta-externa/${appointment.id}`);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!appointmentToCancel) return;

    try {
      const response = await fetch(`/api/appointments/${appointmentToCancel.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelado" }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Cita cancelada exitosamente",
        });
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Error al cancelar la cita",
          variant: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cancelar la cita",
        variant: "error",
      });
    } finally {
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const handleChangeStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Estado de la cita actualizado exitosamente",
        });
        setChangeStatusModalOpen(false);
        setSelectedAppointment(null);
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Error al actualizar el estado",
          variant: "error",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el estado",
        variant: "error",
      });
    }
  };

  // Si el usuario es recepcion, no mostrar nada (será redirigido)
  if (!user || user.role?.name === 'recepcion') {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Consulta Externa
            </h2>
            <p className="text-gray-600">
              {user?.role?.name === 'admin'
                ? 'Todas las citas pendientes para consulta médica'
                : `Citas pendientes de ${user?.specialty?.name || 'tu especialidad'}`
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {(user?.role?.name === 'especialista' || user?.role?.name === 'admin') && (
              <Button
                onClick={() => setIsNuevaConsultaModalOpen(true)}
                className="flex items-center space-x-2 bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus className="h-4 w-4" />
                <span>Nueva Consulta Directa</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de Citas Pendientes */}
      <Card className="bg-transparent border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Citas Pendientes ({filteredAppointments.length})
            </CardTitle>
            <Button
              onClick={loadData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
            >
              <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refrescar
            </Button>
          </div>

          {/* Filtros integrados */}
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Buscar Paciente
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-gray-500"
                  />
                  <Input
                    placeholder="Buscar por nombre o número de identidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                  />
                </div>
              </div>

              {user?.role?.name === 'admin' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Especialidad
                  </label>
                  <Select
                    value={specialtyFilter}
                    onValueChange={setSpecialtyFilter}
                  >
                    <SelectTrigger className="bg-white border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]">
                      <SelectValue placeholder="Todas las especialidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        Todas las especialidades
                      </SelectItem>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <SpinnerWithText text="Cargando citas..." />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                No hay citas pendientes
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || specialtyFilter !== "all"
                  ? "Intenta con otros filtros de búsqueda"
                  : "No hay citas pendientes para consulta en este momento"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#2E9589] text-white rounded-full flex items-center justify-center">
                      <Stethoscope size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-gray-900 text-lg">
                          {appointment.patient.firstName}{" "}
                          {appointment.patient.lastName}
                        </h3>
                        <Badge
                          variant={getStatusBadgeVariant(appointment.status)}
                        >
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                        {appointment.status === 'pendiente' && appointment.turnNumber && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-semibold">
                            Turno #{appointment.turnNumber}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <User size={16} />
                          <span>{appointment.patient.identityNumber}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Stethoscope size={16} />
                          <span>{appointment.specialty.name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar size={16} />
                          <span>{formatDateTime(appointment.appointmentDate)}</span>
                        </span>
                        {appointment.patient.phone && (
                          <span className="flex items-center space-x-1">
                            <Phone size={16} />
                            <span>{appointment.patient.phone}</span>
                          </span>
                        )}
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-500 mt-1">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleStartConsultation(appointment)}
                      className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                      title="Iniciar consulta médica"
                    >
                      <Eye size={16} />
                      <span className="ml-1">Pasar a consulta</span>
                    </Button>
                    <Button
                      onClick={() => handleCancelAppointment(appointment)}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      title="Cancelar cita"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Nueva Consulta Directa */}
      <NuevaConsultaDirectaModal
        isOpen={isNuevaConsultaModalOpen}
        onClose={() => {
          setIsNuevaConsultaModalOpen(false);
          loadData();
        }}
      />

      {/* Dialog de confirmación para cancelar */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Cita</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelDialogOpen(false)}>
              No, mantener
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
