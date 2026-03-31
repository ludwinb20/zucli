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
  Pencil,
  Loader2,
  Thermometer,
  Heart,
  Ruler,
  Weight,
} from "lucide-react";
import {
  Consultation,
  ConsultationItemWithRelations,
  ConsultationVisitContext,
} from "@/types/consultations";
import type { Patient } from "@/types/patients";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ConsultationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [savingDetail, setSavingDetail] = useState(false);
  const [editForm, setEditForm] = useState({
    diagnosis: "",
    currentIllness: "",
    treatment: "",
    vitalSigns: "",
    observations: "",
  });
  const [visitContext, setVisitContext] = useState<ConsultationVisitContext | null>(
    null
  );
  const [visitContextLoading, setVisitContextLoading] = useState(false);
  const [modalPatient, setModalPatient] = useState<Patient | null>(null);
  const [modalPatientLoading, setModalPatientLoading] = useState(false);

  // Ficha del paciente: endpoint estable (no depende de preclínica ni columnas nuevas en consultas)
  useEffect(() => {
    if (!isDetailModalOpen || !selectedConsultation?.patientId) {
      setModalPatient(null);
      return;
    }
    const pid = selectedConsultation.patientId;
    const ac = new AbortController();
    setModalPatientLoading(true);
    setModalPatient(null);

    (async () => {
      try {
        const res = await fetch(`/api/patients/${pid}`, { signal: ac.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (ac.signal.aborted || data?.error) return;
        setModalPatient(data as Patient);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      } finally {
        if (!ac.signal.aborted) setModalPatientLoading(false);
      }
    })();

    return () => ac.abort();
  }, [isDetailModalOpen, selectedConsultation?.patientId]);

  useEffect(() => {
    if (!isDetailModalOpen || !selectedConsultation?.id) {
      setVisitContext(null);
      return;
    }
    const cid = selectedConsultation.id;
    const ac = new AbortController();
    setVisitContextLoading(true);
    setVisitContext(null);

    (async () => {
      try {
        const res = await fetch(`/api/consultations/${cid}/visit-context`, {
          signal: ac.signal,
        });
        if (!res.ok) {
          if (!ac.signal.aborted) {
            toast({
              title: "Aviso",
              description: "No se pudieron cargar los datos de cita/preclínica",
              variant: "warning",
            });
          }
          return;
        }
        const data = (await res.json()) as ConsultationVisitContext;
        if (!ac.signal.aborted) {
          setVisitContext(data);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (!ac.signal.aborted) {
          setVisitContext(null);
        }
      } finally {
        if (!ac.signal.aborted) {
          setVisitContextLoading(false);
        }
      }
    })();

    return () => ac.abort();
  }, [isDetailModalOpen, selectedConsultation?.id, toast]);

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

  const formatDateOnly = (date: Date | string | undefined) => {
    if (date == null || date === "") return "—";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleViewDetails = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setIsEditingDetail(false);
    setIsDetailModalOpen(true);
  };

  const canEditConsultation = (consultation: Consultation) =>
    !!user &&
    (user.role?.name === "admin" ||
      (user.role?.name === "especialista" &&
        consultation.doctorId === user.id));

  const handleEditConsultation = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    setEditForm({
      diagnosis: consultation.diagnosis ?? "",
      currentIllness: consultation.currentIllness ?? "",
      treatment: consultation.treatment ?? "",
      vitalSigns: consultation.vitalSigns ?? "",
      observations: consultation.observations ?? "",
    });
    setIsEditingDetail(true);
    setIsDetailModalOpen(true);
  };

  const cancelEditingDetail = () => {
    setIsEditingDetail(false);
  };

  const saveConsultationEdits = async () => {
    if (!selectedConsultation) return;
    try {
      setSavingDetail(true);
      const res = await fetch(`/api/consultations/${selectedConsultation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosis: editForm.diagnosis.trim() || null,
          currentIllness: editForm.currentIllness.trim() || null,
          treatment: editForm.treatment.trim() || null,
          vitalSigns: editForm.vitalSigns.trim() || null,
          observations: editForm.observations.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Error",
          description: (data as { error?: string }).error || "No se pudo guardar",
          variant: "error",
        });
        return;
      }
      const updated = data as Consultation;
      setSelectedConsultation((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
              doctor: updated.doctor ?? prev.doctor,
              items: prev.items,
            }
          : null
      );
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === updated.id
            ? {
                ...c,
                ...updated,
                doctor: updated.doctor ?? c.doctor,
                items: c.items,
              }
            : c
        )
      );
      setIsEditingDetail(false);
      toast({
        title: "Guardado",
        description: "La consulta se actualizó correctamente",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo guardar los cambios",
        variant: "error",
      });
    } finally {
      setSavingDetail(false);
    }
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
                  
                  {/* Botones de acción */}
                  <div className="flex flex-wrap items-center justify-end gap-2 ml-4 shrink-0">
                    {canEditConsultation(consultation) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
                        onClick={() => handleEditConsultation(consultation)}
                        title="Editar anotaciones de la consulta"
                      >
                        <Pencil size={16} />
                        <span className="ml-1">Editar</span>
                      </Button>
                    )}
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
        <Dialog
          open={isDetailModalOpen}
          onOpenChange={(open) => {
            setIsDetailModalOpen(open);
            if (!open) setIsEditingDetail(false);
          }}
        >
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:pr-8">
                <DialogTitle className="flex items-center space-x-2 text-xl text-[#2E9589]">
                  <FileText size={24} />
                  <span>
                    {isEditingDetail
                      ? "Editar consulta"
                      : "Detalles de la Consulta"}
                  </span>
                </DialogTitle>
                {isEditingDetail && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={cancelEditingDetail}
                      disabled={savingDetail}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                      onClick={saveConsultationEdits}
                      disabled={savingDetail}
                    >
                      {savingDetail ? (
                        <>
                          <Loader2 size={16} className="mr-1.5 animate-spin" />
                          Guardando…
                        </>
                      ) : (
                        "Guardar cambios"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>
            
            <div className="pt-4 space-y-4">
              {/* Paciente, consulta médica, cita y preclínica */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Paciente y preclínica
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {visitContext?.match === "inferred" && (
                      <Badge
                        variant="outline"
                        className="text-amber-900 border-amber-200 bg-amber-50"
                      >
                        Cita estimada (±48 h)
                      </Badge>
                    )}
                    {visitContext?.match === "linked" && (
                      <Badge
                        variant="outline"
                        className="text-[#2E9589] border-[#2E9589]/40 bg-[#2E9589]/10"
                      >
                        Preclínica vinculada
                      </Badge>
                    )}
                  </div>
                </div>

                {modalPatientLoading &&
                  !modalPatient &&
                  !visitContext?.patient &&
                  selectedConsultation.patient && (
                  <p className="text-xs text-gray-500 italic">
                    Cargando ficha completa del paciente…
                  </p>
                )}

                {(modalPatient ||
                  visitContext?.patient ||
                  selectedConsultation.patient) && (
                  <>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">
                        Datos del paciente
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Nombre:</span>{" "}
                          <span className="font-medium">
                            {modalPatient?.firstName ??
                              visitContext?.patient?.firstName ??
                              selectedConsultation.patient?.firstName}{" "}
                            {modalPatient?.lastName ??
                              visitContext?.patient?.lastName ??
                              selectedConsultation.patient?.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Identidad:</span>{" "}
                          <span className="font-medium">
                            {modalPatient?.identityNumber ??
                              visitContext?.patient?.identityNumber ??
                              selectedConsultation.patient?.identityNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Nacimiento:</span>{" "}
                          <span className="font-medium">
                            {formatDateOnly(
                              modalPatient?.birthDate ??
                                visitContext?.patient?.birthDate
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Sexo:</span>{" "}
                          <span className="font-medium">
                            {modalPatient?.gender ??
                              visitContext?.patient?.gender ??
                              "—"}
                          </span>
                        </div>
                        {(modalPatient?.phone || visitContext?.patient?.phone) && (
                          <div>
                            <span className="text-gray-600">Teléfono:</span>{" "}
                            <span className="font-medium">
                              {modalPatient?.phone ??
                                visitContext?.patient?.phone}
                            </span>
                          </div>
                        )}
                        {(modalPatient?.address || visitContext?.patient?.address) && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-600">Dirección:</span>{" "}
                            <span className="font-medium">
                              {modalPatient?.address ??
                                visitContext?.patient?.address}
                            </span>
                          </div>
                        )}
                        {(modalPatient?.allergies ||
                          visitContext?.patient?.allergies) && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-600">Alergias:</span>{" "}
                            <span className="font-medium text-red-800">
                              {modalPatient?.allergies ??
                                visitContext?.patient?.allergies}
                            </span>
                          </div>
                        )}
                        {(modalPatient?.medicalHistory ||
                          visitContext?.patient?.medicalHistory) && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-600">Antecedentes:</span>{" "}
                            <span className="font-medium">
                              {modalPatient?.medicalHistory ??
                                visitContext?.patient?.medicalHistory}
                            </span>
                          </div>
                        )}
                        {(modalPatient?.emergencyContactName ||
                          modalPatient?.emergencyContactNumber ||
                          visitContext?.patient?.emergencyContactName ||
                          visitContext?.patient?.emergencyContactNumber) && (
                          <div className="sm:col-span-2 border-t border-gray-200 pt-2 mt-1">
                            <span className="text-gray-600">Contacto emergencia:</span>{" "}
                            <span className="font-medium">
                              {[
                                modalPatient?.emergencyContactName ??
                                  visitContext?.patient?.emergencyContactName,
                                (modalPatient?.emergencyContactRelation ||
                                  visitContext?.patient?.emergencyContactRelation) &&
                                  `(${modalPatient?.emergencyContactRelation ?? visitContext?.patient?.emergencyContactRelation})`,
                                modalPatient?.emergencyContactNumber ??
                                  visitContext?.patient?.emergencyContactNumber,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">
                        Esta consulta (anotaciones médicas)
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Fecha:</span>{" "}
                          <span className="font-medium">
                            {formatDateTime(selectedConsultation.consultationDate)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Médico:</span>{" "}
                          <span className="font-medium">
                            {selectedConsultation.doctor?.name ?? "—"}
                            {selectedConsultation.doctor?.specialty?.name &&
                              ` • ${selectedConsultation.doctor.specialty.name}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        Cita y preclínica
                      </h4>
                      {visitContextLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600 py-1">
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                          Obteniendo cita y preclínica…
                        </div>
                      ) : visitContext ? (
                        <>
                          {visitContext.appointment ? (
                            <p className="text-sm text-gray-700 mb-3">
                              <span className="text-gray-600">Cita:</span>{" "}
                              {formatDateTime(
                                visitContext.appointment.appointmentDate
                              )}
                              {visitContext.appointment.specialty?.name &&
                                ` · ${visitContext.appointment.specialty.name}`}
                              <span className="text-gray-500">
                                {" "}
                                · Estado: {visitContext.appointment.status}
                              </span>
                            </p>
                          ) : visitContext.preclinica ? (
                            <p className="text-sm text-gray-600 mb-3">
                              Preclínica vinculada a esta consulta (sin cita emparejada en el contexto).
                            </p>
                          ) : null}
                          {visitContext.preclinica ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm bg-white p-3 rounded-lg border border-gray-200">
                              {visitContext.preclinica.presionArterial && (
                                <div>
                                  <p className="text-xs text-gray-500">PA</p>
                                  <p className="font-medium">
                                    {visitContext.preclinica.presionArterial}
                                  </p>
                                </div>
                              )}
                              {visitContext.preclinica.temperatura != null && (
                                <div className="flex items-start gap-1.5">
                                  <Thermometer className="h-4 w-4 text-orange-500 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500">Temp.</p>
                                    <p className="font-medium">
                                      {visitContext.preclinica.temperatura}°C
                                    </p>
                                  </div>
                                </div>
                              )}
                              {visitContext.preclinica.fc != null && (
                                <div>
                                  <p className="text-xs text-gray-500">FC</p>
                                  <p className="font-medium">
                                    {visitContext.preclinica.fc} lpm
                                  </p>
                                </div>
                              )}
                              {visitContext.preclinica.fr != null && (
                                <div>
                                  <p className="text-xs text-gray-500">FR</p>
                                  <p className="font-medium">
                                    {visitContext.preclinica.fr} rpm
                                  </p>
                                </div>
                              )}
                              {visitContext.preclinica.satO2 != null && (
                                <div>
                                  <p className="text-xs text-gray-500">Sat O₂</p>
                                  <p className="font-medium">
                                    {visitContext.preclinica.satO2}%
                                  </p>
                                </div>
                              )}
                              {visitContext.preclinica.peso != null && (
                                <div className="flex items-start gap-1.5">
                                  <Weight className="h-4 w-4 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500">Peso</p>
                                    <p className="font-medium">
                                      {visitContext.preclinica.peso} lb
                                    </p>
                                  </div>
                                </div>
                              )}
                              {visitContext.preclinica.talla != null && (
                                <div className="flex items-start gap-1.5">
                                  <Ruler className="h-4 w-4 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500">Talla</p>
                                    <p className="font-medium">
                                      {visitContext.preclinica.talla} cm
                                    </p>
                                  </div>
                                </div>
                              )}
                              {visitContext.preclinica.examenFisico && (
                                <div className="col-span-2 md:col-span-3">
                                  <p className="text-xs text-gray-500 mb-1">
                                    Examen físico
                                  </p>
                                  <p className="text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">
                                    {visitContext.preclinica.examenFisico}
                                  </p>
                                </div>
                              )}
                              {visitContext.preclinica.idc && (
                                <div className="col-span-2 md:col-span-3">
                                  <p className="text-xs text-gray-500 mb-1">IDC</p>
                                  <p className="text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">
                                    {visitContext.preclinica.idc}
                                  </p>
                                </div>
                              )}
                              {visitContext.preclinica.tx && (
                                <div className="col-span-2 md:col-span-3">
                                  <p className="text-xs text-gray-500 mb-1">Tx</p>
                                  <p className="text-gray-900 bg-gray-50 p-2 rounded border border-gray-100">
                                    {visitContext.preclinica.tx}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">
                              {visitContext.appointment
                                ? "Esta cita no tiene registro de preclínica."
                                : "No hay datos de preclínica para mostrar."}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3">
                          No se pudo cargar la cita ni la preclínica.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {!modalPatientLoading &&
                  !modalPatient &&
                  !visitContext?.patient &&
                  !selectedConsultation.patient && (
                  <p className="text-sm text-gray-500">
                    No hay datos de paciente para mostrar.
                  </p>
                )}
              </div>

              {/* Diagnóstico */}
              {(isEditingDetail || selectedConsultation.diagnosis) && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                    <AlertCircle size={16} className="text-red-500" />
                    <span>Diagnóstico</span>
                  </Label>
                  {isEditingDetail ? (
                    <Textarea
                      value={editForm.diagnosis}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, diagnosis: e.target.value }))
                      }
                      rows={3}
                      className="text-sm bg-red-50 border-red-200 focus-visible:ring-[#2E9589]"
                      placeholder="Diagnóstico…"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-red-50 p-3 rounded border border-red-200">
                      {selectedConsultation.diagnosis}
                    </p>
                  )}
                </div>
              )}

              {/* Enfermedad Actual */}
              {(isEditingDetail || selectedConsultation.currentIllness) && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700">
                    Síntomas / Enfermedad Actual
                  </Label>
                  {isEditingDetail ? (
                    <Textarea
                      value={editForm.currentIllness}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, currentIllness: e.target.value }))
                      }
                      rows={3}
                      className="text-sm bg-gray-50 border-gray-200 focus-visible:ring-[#2E9589]"
                      placeholder="Síntomas o enfermedad actual…"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                      {selectedConsultation.currentIllness}
                    </p>
                  )}
                </div>
              )}

              {/* Tratamiento */}
              {(isEditingDetail || selectedConsultation.treatment) && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                    <Stethoscope size={16} className="text-[#2E9589]" />
                    <span>Tratamiento Indicado</span>
                  </Label>
                  {isEditingDetail ? (
                    <Textarea
                      value={editForm.treatment}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, treatment: e.target.value }))
                      }
                      rows={3}
                      className="text-sm bg-green-50 border-green-200 focus-visible:ring-[#2E9589]"
                      placeholder="Tratamiento indicado…"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-green-50 p-3 rounded border border-green-200">
                      {selectedConsultation.treatment}
                    </p>
                  )}
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
              {(isEditingDetail || selectedConsultation.vitalSigns) && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                    <Activity size={16} className="text-blue-500" />
                    <span>Signos Vitales</span>
                  </Label>
                  {isEditingDetail ? (
                    <Textarea
                      value={editForm.vitalSigns}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, vitalSigns: e.target.value }))
                      }
                      rows={3}
                      className="text-sm bg-blue-50 border-blue-200 focus-visible:ring-[#2E9589]"
                      placeholder="Signos vitales…"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                      {selectedConsultation.vitalSigns}
                    </p>
                  )}
                </div>
              )}

              {/* Observaciones */}
              {(isEditingDetail || selectedConsultation.observations) && (
                <div className="space-y-1">
                  <Label className="text-sm font-semibold text-gray-700">
                    Observaciones
                  </Label>
                  {isEditingDetail ? (
                    <Textarea
                      value={editForm.observations}
                      onChange={(e) =>
                        setEditForm((f) => ({ ...f, observations: e.target.value }))
                      }
                      rows={3}
                      className="text-sm bg-yellow-50 border-yellow-200 focus-visible:ring-[#2E9589]"
                      placeholder="Observaciones…"
                    />
                  ) : (
                    <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200 italic">
                      {selectedConsultation.observations}
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

