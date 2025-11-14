"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Plus,
  Search,
  Calendar,
  User,
  Bed,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { HospitalizationWithRelations } from "@/types/hospitalization";
import { calculateDaysOfStay, getHospitalizationStatusBadge, formatDaysOfStay, getDailyRate } from "@/lib/hospitalization-helpers";
import HospitalizationModal from "@/components/HospitalizationModal";

export default function HospitalizacionesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [hospitalizations, setHospitalizations] = useState<(HospitalizationWithRelations & { daysOfStay: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("iniciada");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadHospitalizations = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/hospitalizations?${params}`);
      if (!response.ok) throw new Error("Error al cargar hospitalizaciones");

      const data = await response.json();
      setHospitalizations(data.hospitalizations);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las hospitalizaciones",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm, toast]);

  useEffect(() => {
    loadHospitalizations();
  }, [loadHospitalizations]);

  // Verificar permisos
  useEffect(() => {
    if (user && !["admin", "recepcion", "especialista", "medico_sala"].includes(user.role?.name || "")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleOpenNew = () => {
    setIsModalOpen(true);
  };

  const handleOpenDetails = (id: string) => {
    router.push(`/hospitalizaciones/${id}`);
  };

  const handleSave = async () => {
    setIsModalOpen(false);
    loadHospitalizations();
  };

  if (!user || !["admin", "recepcion", "especialista", "medico_sala"].includes(user.role?.name || "")) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Bed className="h-7 w-7 text-[#2E9589]" />
          Hospitalizaciones
        </h2>
        <p className="text-gray-600">
          Gestión de pacientes hospitalizados
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-6 bg-white border-gray-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar paciente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre o identidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
              >
                <option value="all">Todos</option>
                <option value="iniciada">Activas</option>
                <option value="completada">Dadas de Alta</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleOpenNew}
                className="w-full bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Hospitalización
              </Button>
            </div>
          </div>
        {/* </CardContent>
      </Card>

      {/* Lista de Hospitalizaciones
      <Card className="bg-white border-gray-200">
        <CardContent className="pt-6"> */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Spinner size="lg" />
            </div>
          ) : hospitalizations.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay hospitalizaciones
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron hospitalizaciones con los filtros aplicados"
                  : "No hay hospitalizaciones registradas"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-8">
              {hospitalizations.map((hosp) => {
                const statusConfig = getHospitalizationStatusBadge(hosp.status);
                const dailyRate = getDailyRate(hosp.dailyRateItem, hosp.dailyRateVariant);
                const totalCost = hosp.daysOfStay * dailyRate;

                return (
                  <div
                    key={hosp.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetails(hosp.id)}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {hosp.patient.firstName} {hosp.patient.lastName}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{hosp.patient.identityNumber}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Bed className="h-4 w-4" />
                          <span>{hosp.room?.number || "Sin habitación"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(hosp.admissionDate).toLocaleDateString("es-HN")} ({formatDaysOfStay(hosp.daysOfStay)})
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(hosp.id);
                      }}
                      className="bg-[#2E9589] hover:bg-[#2E9589]/90 cursor-pointer text-white"
                    >
                      Ver Detalles
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Mostrando {hospitalizations.length} de {totalCount} hospitalizaciones
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Nueva Hospitalización */}
      <HospitalizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        hospitalization={null}
      />
    </div>
  );
}

