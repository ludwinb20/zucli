"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SpinnerWithText } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Calendar,
  User,
  Stethoscope,
  Eye,
  RefreshCw,
  FileText,
  AlertCircle,
  Package,
  Activity,
} from "lucide-react";
import { Consultation, ConsultationItemWithRelations } from "@/types/consultations";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export default function ConsultationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Si el usuario es especialista, filtrar por su doctorId
      if (user?.role?.name === 'especialista' && user.id) {
        const params = new URLSearchParams({
          doctorId: user.id,
          status: 'completed',
          limit: '100'
        });

        const url = `/api/consultations?${params.toString()}`;
        console.log("Fetching consultas para especialista:", url);
        const consultationsResponse = await fetch(url);
        if (consultationsResponse.ok) {
          const data = await consultationsResponse.json();
          console.log("Consultas recibidas:", data);
          setConsultations(data.consultations || []);
        } else {
          const errorData = await consultationsResponse.json().catch(() => ({}));
          console.error("Error en respuesta de API:", errorData);
          toast({
            title: "Error",
            description: errorData.error || "Error al cargar las consultas",
            variant: "error",
          });
        }
      } else if (user?.role?.name === 'admin') {
        // Admin puede ver todas las consultas completadas
        const params = new URLSearchParams({
          status: 'completed',
          limit: '100'
        });

        const url = `/api/consultations?${params.toString()}`;
        console.log("Fetching consultas para admin:", url);
        const consultationsResponse = await fetch(url);
        if (consultationsResponse.ok) {
          const data = await consultationsResponse.json();
          console.log("Consultas recibidas (admin):", data);
          setConsultations(data.consultations || []);
        } else {
          const errorData = await consultationsResponse.json().catch(() => ({}));
          console.error("Error en respuesta de API:", errorData);
          toast({
            title: "Error",
            description: errorData.error || "Error al cargar las consultas",
            variant: "error",
          });
        }
      } else {
        console.log("Usuario no tiene permisos o no está configurado correctamente:", user);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Error al cargar las consultas",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Cargar datos iniciales
  useEffect(() => {
    console.log("Usuario actual:", user);
    if (user && (user.role?.name === 'especialista' || user.role?.name === 'admin')) {
      console.log("Cargando datos para usuario:", user.role?.name, user.id);
      loadData();
    } else {
      console.log("Usuario no tiene permisos o no está cargado");
    }
  }, [loadData, user]);

  // Filtrar consultas localmente (búsqueda por texto)
  const filteredConsultations = consultations.filter((consultation) => {
    const matchesSearch =
      consultation.patient?.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      consultation.patient?.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      consultation.patient?.identityNumber.includes(searchTerm) ||
      consultation.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  const handleViewDetails = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsDetailModalOpen(true);
  };

  // Si el usuario no es especialista ni admin, no mostrar nada
  if (!user || (user.role?.name !== 'especialista' && user.role?.name !== 'admin')) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mis Consultas Completadas
            </h2>
            <p className="text-gray-600">
              {user?.role?.name === 'admin'
                ? 'Todas las consultas completadas'
                : 'Historial de todas tus consultas completadas con sus anotaciones'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Consultas Completadas */}
      <Card className="bg-transparent border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Consultas Completadas ({filteredConsultations.length})
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

          {/* Filtro de búsqueda */}
          <div className="mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Buscar Consulta
              </label>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-gray-500"
                />
                <Input
                  placeholder="Buscar por paciente, identidad o diagnóstico..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <SpinnerWithText text="Cargando consultas..." />
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                No hay consultas completadas
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : "No hay consultas completadas para mostrar"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredConsultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-[#2E9589] text-white rounded-full flex items-center justify-center">
                      <Stethoscope size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="font-medium text-gray-900 text-lg">
                          {consultation.patient?.firstName}{" "}
                          {consultation.patient?.lastName}
                        </h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Completada
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <User size={16} />
                          <span>{consultation.patient?.identityNumber}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar size={16} />
                          <span>{formatDateTime(consultation.consultationDate)}</span>
                        </span>
                        {consultation.diagnosis && (
                          <span className="flex items-center space-x-1 max-w-xs truncate">
                            <AlertCircle size={16} />
                            <span className="truncate">{consultation.diagnosis}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Botón de acción */}
                  <div className="flex items-center ml-4">
                    <Button
                      onClick={() => handleViewDetails(consultation)}
                      className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                      title="Ver detalles de la consulta"
                    >
                      <Eye size={16} />
                      <span className="ml-1">Ver Anotaciones</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles de Consulta */}
      {selectedConsultation && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-xl text-[#2E9589]">
                <FileText size={24} />
                <span>Detalles de la Consulta</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="pt-4 space-y-4">
              {/* Información del Paciente */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Información del Paciente</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Paciente:</span>{" "}
                    <span className="font-medium">
                      {selectedConsultation.patient?.firstName}{" "}
                      {selectedConsultation.patient?.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Identidad:</span>{" "}
                    <span className="font-medium">
                      {selectedConsultation.patient?.identityNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fecha de Consulta:</span>{" "}
                    <span className="font-medium">
                      {formatDateTime(selectedConsultation.consultationDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Médico:</span>{" "}
                    <span className="font-medium">
                      {selectedConsultation.doctor?.name}
                      {selectedConsultation.doctor?.specialty?.name && 
                        ` • ${selectedConsultation.doctor.specialty.name}`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Diagnóstico */}
              {selectedConsultation.diagnosis && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                    <AlertCircle size={16} className="text-red-500" />
                    <span>Diagnóstico</span>
                  </Label>
                  <p className="text-sm text-gray-900 bg-red-50 p-3 rounded border border-red-200">
                    {selectedConsultation.diagnosis}
                  </p>
                </div>
              )}

              {/* Enfermedad Actual */}
              {selectedConsultation.currentIllness && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700">
                    Síntomas / Enfermedad Actual
                  </Label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                    {selectedConsultation.currentIllness}
                  </p>
                </div>
              )}

              {/* Tratamiento */}
              {selectedConsultation.treatment && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                    <Stethoscope size={16} className="text-[#2E9589]" />
                    <span>Tratamiento Indicado</span>
                  </Label>
                  <p className="text-sm text-gray-900 bg-green-50 p-3 rounded border border-green-200">
                    {selectedConsultation.treatment}
                  </p>
                </div>
              )}

              {/* Items/Medicamentos */}
              {selectedConsultation.items && selectedConsultation.items.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                    <Package size={16} />
                    <span>Medicamentos y Servicios ({selectedConsultation.items.length})</span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedConsultation.items.map((item: ConsultationItemWithRelations) => (
                      <div key={item.id} className="flex items-center justify-between p-2.5 bg-white rounded border border-gray-200 hover:border-[#2E9589]/30 transition-colors">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.nombre}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500">x{item.quantity}</p>
                          <p className="text-sm font-semibold text-[#2E9589]">
                            L {item.precioUnitario.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signos Vitales */}
              {selectedConsultation.vitalSigns && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                    <Activity size={16} className="text-blue-500" />
                    <span>Signos Vitales</span>
                  </Label>
                  <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                    {selectedConsultation.vitalSigns}
                  </p>
                </div>
              )}

              {/* Observaciones */}
              {selectedConsultation.observations && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700">
                    Observaciones
                  </Label>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200 italic">
                    {selectedConsultation.observations}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

