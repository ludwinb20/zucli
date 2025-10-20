"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import {
  Plus,
  Search,
  Calendar,
  User,
  Stethoscope,
  DollarSign,
  Activity,
  Scissors,
} from "lucide-react";
import { Surgery, SurgeryStatus } from "@/types/surgery";
import SurgeryModal from "@/components/SurgeryModal";

export default function SurgeriesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSurgeryModalOpen, setIsSurgeryModalOpen] = useState(false);

  useEffect(() => {
    if (user && !["admin", "recepcion", "especialista"].includes(user.role?.name || "")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    loadSurgeries();
  }, [statusFilter]);

  const loadSurgeries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/surgeries?${params}`);
      if (!response.ok) throw new Error("Error al cargar cirugías");

      const data = await response.json();
      setSurgeries(data.surgeries || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las cirugías",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSurgery = async () => {
    setIsSurgeryModalOpen(false);
    await loadSurgeries();
  };

  const getStatusBadge = (status: SurgeryStatus) => {
    const styles = {
      iniciada: "bg-blue-100 text-blue-800 border-blue-200",
      finalizada: "bg-green-100 text-green-800 border-green-200",
    };

    const labels = {
      iniciada: "Iniciada",
      finalizada: "Finalizada",
    };

    return (
      <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const filteredSurgeries = surgeries.filter((surgery) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      surgery.patient?.firstName?.toLowerCase().includes(search) ||
      surgery.patient?.lastName?.toLowerCase().includes(search) ||
      surgery.patient?.identityNumber?.toLowerCase().includes(search) ||
      surgery.surgeryItem?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Scissors className="h-7 w-7 text-[#2E9589]" />
          Cirugías
        </h2>
        <p className="text-gray-600">
          Gestión de cirugías programadas y realizadas
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <Card className="mb-6 bg-white border-gray-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar paciente o procedimiento
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, identidad o procedimiento..."
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
                <option value="iniciada">Iniciadas</option>
                <option value="finalizada">Finalizadas</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={() => setIsSurgeryModalOpen(true)}
                className="w-full bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Cirugía
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>) : filteredSurgeries.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay cirugías
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron cirugías con los filtros aplicados"
                  : "No hay cirugías registradas"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 mt-8">
              {filteredSurgeries.map((surgery) => (
                <div
                  key={surgery.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/surgeries/${surgery.id}`)}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {surgery.patient?.firstName} {surgery.patient?.lastName}
                      </h3>
                      {getStatusBadge(surgery.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{surgery.patient?.identityNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Stethoscope className="h-4 w-4" />
                        <span>{surgery.surgeryItem?.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(surgery.createdAt).toLocaleDateString("es-HN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/surgeries/${surgery.id}`);
                    }}
                    className="bg-[#2E9589] hover:bg-[#2E9589]/90 cursor-pointer text-white"
                  >
                    Ver Detalles
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de creación */}
      <SurgeryModal
        isOpen={isSurgeryModalOpen}
        onClose={() => setIsSurgeryModalOpen(false)}
        onSave={handleSaveSurgery}
      />
    </div>
  );
}

