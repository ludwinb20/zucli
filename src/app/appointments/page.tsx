"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  User,
  Phone,
  Clock,
  Stethoscope,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  Appointment,
  Specialty,
  AppointmentStatus,
  CreateAppointmentData,
  UpdateAppointmentData,
} from "@/types/appointments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import AppointmentModal from "@/components/AppointmentModal";
import ReprogramAppointmentModal from "@/components/ReprogramAppointmentModal";
import ChangeSpecialtyModal from "@/components/ChangeSpecialtyModal";
import ChangeStatusModal from "@/components/ChangeStatusModal";
import PreclinicaModal from "@/components/PreclinicaModal";
import { PreclinicaData } from "@/types";

export default function AppointmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "programado"
  );
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] =
    useState<Appointment | null>(null);

  // Nuevos estados para los modales
  const [reprogramModalOpen, setReprogramModalOpen] = useState(false);
  const [changeSpecialtyModalOpen, setChangeSpecialtyModalOpen] =
    useState(false);
  const [changeStatusModalOpen, setChangeStatusModalOpen] = useState(false);
  const [statusToChange, setStatusToChange] =
    useState<AppointmentStatus | null>(null);
  const [preclinicaModalOpen, setPreclinicaModalOpen] = useState(false);

  const loadData = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true);

      // Construir parámetros de búsqueda
      const params = new URLSearchParams({
        limit: '100',
        page: page.toString()
      });

      // Agregar filtros
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (specialtyFilter !== 'all') {
        params.append('specialtyId', specialtyFilter);
      }

      // Cargar citas
      const appointmentsResponse = await fetch(`/api/appointments?${params.toString()}`);
      if (appointmentsResponse.ok) {
        const data = await appointmentsResponse.json();
        setAppointments(data.appointments || data);
        
        // Actualizar información de paginación
        if (data.pagination) {
          setCurrentPage(data.pagination.currentPage);
          setTotalPages(data.pagination.totalPages);
          setTotalCount(data.pagination.totalCount);
        }
      }

      // Cargar especialidades (solo la primera vez)
      if (specialties.length === 0) {
        const specialtiesResponse = await fetch("/api/specialties");
        if (specialtiesResponse.ok) {
          const specialtiesData = await specialtiesResponse.json();
          console.log("Specialties data received:", specialtiesData);
          console.log("Specialties array:", specialtiesData.specialties);
          setSpecialties(Array.isArray(specialtiesData.specialties) ? specialtiesData.specialties : []);
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
  }, [currentPage, statusFilter, specialtyFilter, specialties.length, toast]);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1); // Reset a página 1 cuando cambien los filtros
    }
    loadData(1);
  }, [statusFilter, specialtyFilter, loadData, currentPage]);

  // Funciones de paginación
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      loadData(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadData(currentPage + 1);
    }
  };

  // Nuevas funciones para manejar los saves
  const handleReprogramSave = async (appointmentId: string, newDate: Date) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentDate: newDate.toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Cita reprogramada exitosamente",
          variant: "success",
        });
        setReprogramModalOpen(false);
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Error al reprogramar la cita",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error reprogramming appointment:", error);
      toast({
        title: "Error",
        description: "Error al reprogramar la cita",
        variant: "error",
      });
    }
  };

  const handleChangeSpecialtySave = async (
    appointmentId: string,
    specialtyId: string
  ) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          specialtyId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Especialidad cambiada exitosamente",
          variant: "success",
        });
        setChangeSpecialtyModalOpen(false);
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Error al cambiar la especialidad",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error changing specialty:", error);
      toast({
        title: "Error",
        description: "Error al cambiar la especialidad",
        variant: "error",
      });
    }
  };

  const handleChangeStatusSave = async (
    appointmentId: string,
    status: string
  ) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
        }),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Cita ${status} exitosamente`,
          variant: "success",
        });
        setChangeStatusModalOpen(false);
        loadData();
      } else {
        console.log(response);
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Error al cambiar el estado",
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error changing status:", error);
      toast({
        title: "Error",
        description: "Error al cambiar el estado",
        variant: "error",
      });
    }
  };

  const handlePreclinicaSave = async (appointmentId: string, preclinicaData: PreclinicaData) => {
    try {
      const response = await fetch('/api/preclinicas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          ...preclinicaData,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Preclínica guardada y cita marcada como pendiente',
          variant: 'success',
        });
        setPreclinicaModalOpen(false);
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Error al guardar la preclínica',
          variant: 'error',
        });
      }
    } catch (error) {
      console.error('Error saving preclinica:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar la preclínica',
        variant: 'error',
      });
    }
  };

  const handleCreateAppointment = () => {
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setDeleteDialogOpen(true);
  };

  // Nuevas funciones para las acciones
  const handleReprogramAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setReprogramModalOpen(true);
  };

  const handleChangeSpecialty = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setChangeSpecialtyModalOpen(true);
  };

  const handleChangeStatus = (
    appointment: Appointment,
    newStatus: AppointmentStatus
  ) => {
    setSelectedAppointment(appointment);
    
    if (newStatus === 'pendiente') {
      // Para pendiente, abrir modal de preclínica
      setPreclinicaModalOpen(true);
    } else {
      // Para otros estados, abrir modal de cambio de estado
      setStatusToChange(newStatus);
      setChangeStatusModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      const response = await fetch(
        `/api/appointments/${appointmentToDelete.id}`,
        {
          method: "DELETE",
        }
      );

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
    } catch {
      toast({
        title: "Error",
        description: "Error al cancelar la cita",
        variant: "error",
      });
    } finally {
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleSaveAppointment = async (data: CreateAppointmentData | UpdateAppointmentData) => {
    try {
      const url = selectedAppointment
        ? `/api/appointments/${selectedAppointment.id}`
        : "/api/appointments";

      const method = selectedAppointment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: selectedAppointment
            ? "Cita actualizada exitosamente"
            : "Cita creada exitosamente",
        });
        setIsModalOpen(false);
        loadData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Error al guardar la cita",
          variant: "error",
        });
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Error al guardar la cita",
        variant: "error",
      });
    }
  };

  // Filtrar citas localmente (solo búsqueda por texto y fecha)
  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      appointment.patient.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.patient.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.patient.identityNumber.includes(searchTerm) ||
      appointment.specialty.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    let matchesDate = true;
    if (dateFilter) {
      const appointmentDate = new Date(appointment.appointmentDate);
      const filterDate = new Date(dateFilter);
      matchesDate =
        appointmentDate.toDateString() === filterDate.toDateString();
    }

    return matchesSearch && matchesDate;
  });

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
    switch (status) {
      case "programado":
        return "default";
      case "pendiente":
        return "secondary";
      case "completado":
        return "default";
      case "cancelado":
        return "destructive";
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Gestión de Citas
            </h2>
            <p className="text-gray-600">
              Administra las citas médicas de los pacientes
            </p>
          </div>
          <Button
            onClick={handleCreateAppointment}
            className="flex items-center space-x-2 bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Nueva Cita</span>
          </Button>
        </div>
      </div>

      {/* Lista de Citas */}
      <Card className="bg-transparent border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Lista de Citas ({totalCount > 0 ? `${appointments.length} de ${totalCount}` : appointments.length})
            </CardTitle>
            <Button
              onClick={() => loadData(currentPage)}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Buscar
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-3 text-gray-500"
                  />
                  <Input
                    placeholder="Buscar por paciente o especialidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Estado
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: AppointmentStatus) => setStatusFilter(value)}
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                    <SelectItem value="all">Todas las especialidades</SelectItem>
                    {Array.isArray(specialties) && specialties.map((specialty) => (
                      <SelectItem key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Fecha
                </label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        {loading ? (
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E9589]"></div>
                <p className="text-gray-600 text-sm">Cargando citas...</p>
              </div>
            </div>
          </CardContent>
        ) : (
          <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                No se encontraron citas
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ||
                statusFilter !== "all" ||
                specialtyFilter !== "all" ||
                dateFilter
                  ? "Intenta con otros filtros de búsqueda"
                  : "No hay citas programadas en el sistema"}
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
                      <Calendar size={24} />
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
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <User size={16} />
                          <span>{appointment.patient.identityNumber}</span>
                        </span>
                        <span>{appointment.specialty.name}</span>
                        <span>
                          {formatDateTime(appointment.appointmentDate)}
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
                  <div className="grid grid-cols-3 gap-2 w-64">
                    {/* Primera fila centrada (2 botones en medio) */}
                    <div className="col-span-3 flex justify-center gap-2">
                      {appointment.status !== "cancelado" &&
                        appointment.status !== "completado" && (
                          <>
                            {appointment.status !== "pendiente" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleChangeStatus(appointment, "pendiente")
                              }
                              className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                              title="Marcar como pendiente"
                            >
                              <AlertCircle size={16} />
                            </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleChangeStatus(appointment, "cancelado")
                              }
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              title="Cancelar cita"
                            >
                              <X size={16} />
                            </Button>
                          </>
                        )}
                    </div>

                    <div className="col-span-3 flex justify-center gap-2">

                    {/* Segunda fila (3 botones, ocupan todo el ancho) */}
                    {appointment.status !== "cancelado" &&
                      appointment.status !== "completado" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleReprogramAppointment(appointment)
                            }
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            title="Reprogramar cita"
                          >
                            <Clock size={16} />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangeSpecialty(appointment)}
                            className="border-green-300 text-green-600 hover:bg-green-50"
                            title="Cambiar especialidad"
                          >
                            <Stethoscope size={16} />
                          </Button>

                          {user?.role?.name === "admin" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteAppointment(appointment)
                              }
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              title="Eliminar cita"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        )}

        {/* Navegación de páginas */}
        {!loading && totalPages > 1 && (
          <CardContent className="border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * 100) + 1} - {Math.min(currentPage * 100, totalCount)} de {totalCount} citas
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft size={16} />
                  <span>Anterior</span>
                </Button>
                
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">Página</span>
                  <span className="font-medium text-gray-900">{currentPage}</span>
                  <span className="text-sm text-gray-600">de</span>
                  <span className="font-medium text-gray-900">{totalPages}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1"
                >
                  <span>Siguiente</span>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Modal de Cita */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        onSave={handleSaveAppointment}
        specialties={specialties}
        isLoading={loading}
      />

      {/* Dialog de Confirmación de Eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar esta cita? Esta acción no se
              puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Sí, eliminar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Reprogramar Cita */}
      {selectedAppointment && (
        <ReprogramAppointmentModal
          isOpen={reprogramModalOpen}
          onClose={() => setReprogramModalOpen(false)}
          appointment={{ id: selectedAppointment.id, date: selectedAppointment.appointmentDate.toString() }}
          onSave={handleReprogramSave}
          isLoading={loading}
        />
      )}

      {/* Modal de Cambiar Especialidad */}
      {selectedAppointment && (
        <ChangeSpecialtyModal
          isOpen={changeSpecialtyModalOpen}
          onClose={() => setChangeSpecialtyModalOpen(false)}
          appointment={{ id: selectedAppointment.id, specialtyId: selectedAppointment.specialtyId }}
          specialties={specialties.map(s => ({ id: s.id, name: s.name }))}
          onSave={handleChangeSpecialtySave}
          isLoading={loading}
        />
      )}

      {/* Modal de Cambiar Estado */}
      {statusToChange && selectedAppointment && (
        <ChangeStatusModal
          isOpen={changeStatusModalOpen}
          onClose={() => setChangeStatusModalOpen(false)}
          appointment={{ id: selectedAppointment.id, status: selectedAppointment.status }}
          newStatus={statusToChange}
          onSave={handleChangeStatusSave}
          isLoading={loading}
        />
      )}

      {/* Modal de Preclínica */}
      {selectedAppointment && (
        <PreclinicaModal
          isOpen={preclinicaModalOpen}
          onClose={() => setPreclinicaModalOpen(false)}
          appointment={{ id: selectedAppointment.id, patientId: selectedAppointment.patientId }}
          onSave={handlePreclinicaSave}
          isLoading={loading}
        />
      )}
    </div>
  );
}
