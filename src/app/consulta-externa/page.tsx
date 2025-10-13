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
  Search,
  Calendar,
  User,
  Phone,
  Stethoscope,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  Appointment,
  Specialty,
} from "@/types/appointments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ConsultaExternaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

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
        setAppointments(data.appointments || data);
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

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [loadData]);

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
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E9589]"></div>
                <p className="text-gray-600 text-sm">Cargando citas...</p>
              </div>
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
                  
                  {/* Botón de acción */}
                  <div className="flex items-center">
                    <Button
                      onClick={() => handleStartConsultation(appointment)}
                      className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                      title="Iniciar consulta médica"
                    >
                      <Eye size={16} />
                      <span className="ml-1">Pasar a consulta</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
