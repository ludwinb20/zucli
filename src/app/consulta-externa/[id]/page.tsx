"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Calendar,
  Stethoscope,
  FileText,
  Heart,
  Activity,
  Thermometer,
  Weight,
  Ruler,
  AlertCircle,
  Save,
  Package,
  FilePlus,
} from "lucide-react";
import {
  Appointment
} from "@/types/appointments";
import { Patient } from "@/types/patients";
import { CreateConsultationData, Consultation } from "@/types/consultations";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { InlineSpinner } from "@/components/ui/spinner";
import type { PreclinicaData, ConsultaData, TreatmentItem } from "@/types/components";
import MedicalDocumentModal from "@/components/MedicalDocumentModal";
import { TreatmentItemsSelector } from "@/components/TreatmentItemsSelector";
import { ConsultaEspecialidad } from "@prisma/client";
import { Payment } from "@/types";

export default function ConsultaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  // Unwrap the params promise
  const { id } = use(params);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [preclinica, setPreclinica] = useState<PreclinicaData | null>(null);
  const [previousConsultations, setPreviousConsultations] = useState<Consultation[]>([]);
  const [currentConsultation, setCurrentConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialtyTagIds, setSpecialtyTagIds] = useState<string[]>([]);
  
  // Estados de modales
  const [isPreclinicaModalOpen, setIsPreclinicaModalOpen] = useState(false);
  const [isConsultasPreviasModalOpen, setIsConsultasPreviasModalOpen] = useState(false);
  const [isMedicalDocumentModalOpen, setIsMedicalDocumentModalOpen] = useState(false);
  
  const [consultaData, setConsultaData] = useState<ConsultaData>({
    sintomas: "",
    diagnostico: "",
    tratamientoNotas: "",
    treatmentItems: [],
    observaciones: ""
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar cita
      const appointmentResponse = await fetch(`/api/appointments/${id}`);
      if (!appointmentResponse.ok) {
        toast({
          title: "Error",
          description: "Cita no encontrada",
          variant: "error",
        });
        router.push('/consulta-externa');
        return;
      }

        const appointmentData = await appointmentResponse.json();
        setAppointment(appointmentData);

      // Cargar tags de la especialidad para priorizar en el selector de items
      if (appointmentData.specialtyId) {
        try {
          const specialtyResponse = await fetch(`/api/specialties/${appointmentData.specialtyId}`);
          if (specialtyResponse.ok) {
            const specialtyData = await specialtyResponse.json();
            // Extraer IDs de tags asociados a la especialidad a través de serviceItems
            const tagIds = new Set<string>();
            
            // Si la especialidad tiene serviceItems configurados, usar sus tags
            if (specialtyData.consultaEspecialidad && specialtyData.consultaEspecialidad.length > 0) {
              specialtyData.consultaEspecialidad.forEach((ce: { serviceItem: { tags?: Array<{ id: string }> } }) => {
                ce.serviceItem?.tags?.forEach((tag: { id: string }) => {
                  tagIds.add(tag.id);
                });
              });
            }
            
            setSpecialtyTagIds(Array.from(tagIds));
          }
        } catch (error) {
          console.error('Error loading specialty tags:', error);
        }
      }

        // Verificar que la cita es pendiente
        if (appointmentData.status !== 'pendiente') {
          toast({
            title: "Error",
            description: "Esta cita no está en estado pendiente",
            variant: "error",
          });
          router.push('/consulta-externa');
          return;
        }

        // Verificar permisos para especialistas
        if (user?.role?.name === 'especialista' && 
            user.specialty?.id !== appointmentData.specialtyId) {
          toast({
            title: "Error",
            description: "No tienes permisos para ver esta cita",
            variant: "error",
          });
          router.push('/consulta-externa');
          return;
        }

        // Cargar datos del paciente
        const patientResponse = await fetch(`/api/patients/${appointmentData.patientId}`);
        if (patientResponse.ok) {
          const patientData = await patientResponse.json();
          setPatient(patientData);
        }

        // Cargar preclínica
        const preclinicaResponse = await fetch(`/api/preclinicas?appointmentId=${id}`);
        if (preclinicaResponse.ok) {
          const preclinicaData = await preclinicaResponse.json();
          setPreclinica(preclinicaData);
        }

      // Verificar/Crear consulta y pago automáticamente si el usuario tiene especialidad
      if (user?.specialty?.id) {
        // Obtener la configuración de consulta para esta especialidad
        const consultaConfigRes = await fetch("/api/consulta-especialidad");
        if (consultaConfigRes.ok) {
          const consultaEspecialidades = await consultaConfigRes.json();
          const config = consultaEspecialidades.find(
            (ce: ConsultaEspecialidad) => ce.specialtyId === user.specialty?.id
          );

          if (config) {
            const priceToUse = config.variantId
              ? config.variant.price
              : config.serviceItem.basePrice;

            const itemName = config.variantId
              ? `${config.serviceItem.name} - ${config.variant.name}`
              : config.serviceItem.name;

            let consultationCreated = false;
            let paymentCreated = false;

            // 1. Verificar/Crear Consulta
            const consultationsRes = await fetch(
              `/api/consultations?patientId=${appointmentData.patientId}&status=pending`
            );
            
            let pendingConsultation = null;

            if (consultationsRes.ok) {
              const consultationsData = await consultationsRes.json();
              pendingConsultation = consultationsData.consultations?.[0];
            }

            if (!pendingConsultation) {
              // Crear consulta con el item configurado
              const createConsultationRes = await fetch("/api/consultations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  patientId: appointmentData.patientId,
                  doctorId: user.id,
                  status: "pending",
                  items: [
                    {
                      serviceItemId: config.serviceItemId,
                      variantId: config.variantId || null,
                      quantity: 1,
                      nombre: itemName,
                      precioUnitario: priceToUse,
                      descuento: 0,
                      total: priceToUse,
                    },
                  ],
                }),
              });

              if (createConsultationRes.ok) {
                const consultationData = await createConsultationRes.json();
                pendingConsultation = consultationData;
                consultationCreated = true;
              }
            }

            // 2. Verificar/Crear Pago
            const paymentsRes = await fetch(
              `/api/payments?patientId=${appointmentData.patientId}&status=pendiente`
            );
            
            let paymentExists = false;

            if (paymentsRes.ok) {
              const paymentsData = await paymentsRes.json();
              const existingPayment = paymentsData.payments?.find(
                (p: Payment) => p.status === "pendiente"
              );
              paymentExists = !!existingPayment;
            }

            if (!paymentExists) {
              // Crear pago con el item configurado
              const createPaymentRes = await fetch("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  patientId: appointmentData.patientId,
                  status: "pendiente",
                  items: [
                    {
                      priceId: config.serviceItemId,
                      variantId: config.variantId || null,
                      nombre: itemName,
                      precioUnitario: priceToUse,
                      quantity: 1,
                    },
                  ],
                }),
              });

              if (createPaymentRes.ok) {
                paymentCreated = true;
              }
            }

            // Mostrar notificación si se creó algo
            if (consultationCreated || paymentCreated) {
              const actions = [];
              if (consultationCreated) actions.push("Consulta");
              if (paymentCreated) actions.push("Pago");
              
              toast({
                title: `${actions.join(" y ")} ${actions.length > 1 ? 'creados' : 'creado'}`,
                description: `Se agregó automáticamente: ${itemName}`,
                variant: "success",
              });
            }

            // Cargar la consulta y sus items
            if (pendingConsultation) {
              setCurrentConsultation(pendingConsultation);
              
              // Cargar los items de la consulta pendiente en treatmentItems
              const treatmentItems: TreatmentItem[] = pendingConsultation.items?.map((item: {
                id: string;
                serviceItemId: string;
                variantId?: string | null;
                nombre: string;
                precioUnitario: number;
                cantidad: number;
              }) => ({
                id: item.id,
                priceId: item.serviceItemId,
                variantId: item.variantId || undefined,
                name: item.nombre, // Usar snapshot
                price: item.precioUnitario, // Usar snapshot
                quantity: item.cantidad,
                type: item.variantId ? 'variant' : 'price',
              })) || [];
              
              setConsultaData(prev => ({
                ...prev,
                treatmentItems,
              }));
            }
          }
        }
      } else {
        // Si no tiene especialidad configurada, solo cargar consulta si existe
        const currentConsultationResponse = await fetch(`/api/consultations?patientId=${appointmentData.patientId}&status=pending`);
        if (currentConsultationResponse.ok) {
          const currentConsultationData = await currentConsultationResponse.json();
          const pendingConsultation = currentConsultationData.consultations?.[0];
          
          if (pendingConsultation) {
            setCurrentConsultation(pendingConsultation);
            
            // Cargar los items de la consulta pendiente en treatmentItems
            const treatmentItems: TreatmentItem[] = pendingConsultation.items?.map((item: {
              id: string;
              serviceItemId: string;
              variantId?: string | null;
              nombre: string;
              precioUnitario: number;
              cantidad: number;
            }) => ({
              id: item.id,
              priceId: item.serviceItemId,
              variantId: item.variantId || undefined,
              name: item.nombre, // Usar snapshot
              price: item.precioUnitario, // Usar snapshot
              quantity: item.cantidad,
              type: item.variantId ? 'variant' : 'price',
            })) || [];
            
            setConsultaData(prev => ({
              ...prev,
              treatmentItems,
            }));
          }
        }
      }

      // Cargar consultas previas del paciente (completadas)
        const consultationsResponse = await fetch(`/api/consultations?patientId=${appointmentData.patientId}&status=completed`);
        if (consultationsResponse.ok) {
          const consultationsData = await consultationsResponse.json();
          setPreviousConsultations(consultationsData.consultations || []);
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
  }, [id, toast, router, user]);

  // Cargar datos iniciales
  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  const handleInputChange = (field: keyof ConsultaData, value: string) => {
    setConsultaData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!appointment || !patient || !user) {
        throw new Error("Datos faltantes");
      }

      let consultationResponse;

      if (currentConsultation) {
        // Actualizar la consulta existente
        consultationResponse = await fetch(`/api/consultations/${currentConsultation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            diagnosis: consultaData.diagnostico,
            currentIllness: consultaData.sintomas,
            treatment: consultaData.tratamientoNotas,
            observations: consultaData.observaciones,
            status: 'completed',
          }),
        });
      } else {
        // Crear nueva consulta
      const consultationData: CreateConsultationData = {
        patientId: patient.id,
        doctorId: user.id,
        diagnosis: consultaData.diagnostico,
        currentIllness: consultaData.sintomas,
        treatment: consultaData.tratamientoNotas,
        items: consultaData.treatmentItems.map(item => ({
          serviceItemId: item.priceId,
          variantId: item.variantId,
          quantity: item.quantity,
          nombre: item.name,
          precioUnitario: item.price,
          descuento: 0,
          total: item.price * item.quantity,
        })),
        observations: consultaData.observaciones,
      };

        consultationResponse = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consultationData),
      });
      }

      if (!consultationResponse.ok) {
        throw new Error('Error al guardar la consulta');
      }

      // Actualizar el estado de la cita a completado
      const appointmentResponse = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completado' }),
      });

      if (!appointmentResponse.ok) {
        throw new Error('Error al actualizar el estado de la cita');
      }
      
      toast({
        title: "Éxito",
        description: "Consulta guardada exitosamente",
        variant: "success",
      });

      // Redirigir a consulta externa
      router.push('/consulta-externa');

    } catch (error) {
      console.error("Error saving consultation:", error);
      toast({
        title: "Error",
        description: "Error al guardar la consulta",
        variant: "error",
      });
    } finally {
      setSaving(false);
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

  const calculateAge = (birthDate: Date | string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <InlineSpinner size="md" />
            <p className="text-gray-600 text-sm">Cargando consulta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!appointment || !patient) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">
            No se pudo cargar la consulta
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Botones Fixed en la parte inferior */}
      <div className="fixed bottom-6 right-6 flex gap-3 z-50">
        {preclinica && (
          <Button
            onClick={() => setIsPreclinicaModalOpen(true)}
            className="bg-[#2E9589] hover:bg-[#257066] text-white shadow-lg"
            size="lg"
          >
            <Activity size={20} className="mr-2" />

          </Button>
        )}
        {previousConsultations.length > 0 && (
          <Button
            onClick={() => setIsConsultasPreviasModalOpen(true)}
            className="bg-[#2E9589] hover:bg-[#257066] text-white shadow-lg"
            size="lg"
            >
            <FileText size={20} className="mr-2" />

          </Button>
        )}
        {/* Botón Emitir Documento Médico */}
        <Button
          onClick={() => setIsMedicalDocumentModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="lg"
          title="Emitir Documento Médico"
        >
          <FilePlus size={20} className="mr-2" />
          Emitir Documento
        </Button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
           {/* Información del Paciente */}
        <Card className="bg-white shadow-sm border border-gray-100">
             <CardHeader className="bg-gradient-to-r from-[#2E9589] to-[#2E9589]/80 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
               <CardTitle className="flex items-center space-x-2 text-lg text-white">
                 <User size={20} />
                 <span>{patient.firstName} {patient.lastName}</span>
               </CardTitle>
              <div className="flex items-center space-x-4 text-white text-sm">
                <div className="flex items-center space-x-1">
                  <Stethoscope size={16} />
                  <span>{appointment.specialty.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>{formatDateTime(appointment.appointmentDate)}</span>
                </div>
              </div>
            </div>
             </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="p-3 bg-[#2E9589]/10 rounded-lg border border-[#2E9589]/20">
                  <Label className="text-xs text-[#2E9589] font-medium">Edad</Label>
                  <p className="text-lg font-semibold text-[#2E9589]">{calculateAge(patient.birthDate)} años</p>
                </div>
                <div className="p-3 bg-[#2E9589]/10 rounded-lg border border-[#2E9589]/20">
                  <Label className="text-xs text-[#2E9589] font-medium">Sexo</Label>
                  <p className="text-lg font-semibold text-[#2E9589]">{patient.gender}</p>
                </div>
              <div className="p-3 bg-[#2E9589]/10 rounded-lg border border-[#2E9589]/20">
                <Label className="text-xs text-[#2E9589] font-medium">Identidad</Label>
                <p className="text-sm font-medium text-[#2E9589]">{patient.identityNumber}</p>
              </div>
              {patient.phone && (
                <div className="p-3 bg-[#2E9589]/10 rounded-lg border border-[#2E9589]/20">
                  <Label className="text-xs text-[#2E9589] font-medium">Teléfono</Label>
                  <p className="text-sm font-medium text-[#2E9589]">{patient.phone}</p>
                  </div>
                )}
                {patient.address && (
                  <div className="p-3 bg-[#2E9589]/10 rounded-lg border border-[#2E9589]/20">
                  <Label className="text-xs text-[#2E9589] font-medium">Dirección</Label>
                    <p className="text-sm font-medium text-[#2E9589]">{patient.address}</p>
                  </div>
                )}
              {/* Alergias - Ocupa 2 columnas */}
              <div className="col-span-2 p-3 bg-red-50 rounded-lg border-2 border-red-400">
                <Label className="text-xs text-red-700 font-semibold">Alergias</Label>
                <p className="text-sm text-red-900 mt-1 font-medium">
                  {patient.allergies || "No registradas"}
                </p>
              </div>
              {/* Historia médica - Ocupa 2 columnas */}
              <div className="col-span-2 p-3 bg-orange-50 rounded-lg border border-orange-300">
                <Label className="text-xs text-orange-700 font-semibold">Enfermedades Base</Label>
                <p className="text-sm text-orange-900 mt-1">
                  {patient.medicalHistory || "No registrada"}
                </p>
              </div>
              </div>
            </CardContent>
          </Card>

        {/* Formulario de Historial Clínico - Ocupa todo el ancho */}
        <Card className="bg-white shadow-sm border border-gray-100">
             <CardHeader className="bg-gradient-to-r from-[#2E9589] to-[#2E9589]/80 text-white rounded-t-lg">
               <CardTitle className="flex items-center space-x-2 text-lg text-white">
                 <Stethoscope size={20} />
                 <span>Historial Clínico Actual</span>
               </CardTitle>
               <CardDescription className="text-white/90">
                 Complete la información de la consulta médica
               </CardDescription>
             </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Síntomas y Diagnóstico en la misma fila */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Síntomas */}
                <div className="space-y-2">
                  <Label htmlFor="sintomas" className="text-sm font-medium text-gray-700">
                    Síntomas y Motivo de Consulta *
                  </Label>
                  <Textarea
                    id="sintomas"
                    value={consultaData.sintomas}
                    onChange={(e) => handleInputChange('sintomas', e.target.value)}
                    placeholder="Describa los síntomas que presenta el paciente..."
                    rows={5}
                    className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                  />
                </div>

                {/* Diagnóstico */}
                <div className="space-y-2">
                  <Label htmlFor="diagnostico" className="text-sm font-medium text-gray-700">
                    Diagnóstico *
                  </Label>
                  <Textarea
                    id="diagnostico"
                    value={consultaData.diagnostico}
                    onChange={(e) => handleInputChange('diagnostico', e.target.value)}
                    placeholder="Diagnóstico médico basado en la evaluación..."
                    rows={5}
                    className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                  />
                </div>
              </div>

              {/* Tratamiento: Items (2/3) y Notas (1/3) en la misma fila */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Medicamentos y Servicios del Tratamiento - 2 columnas */}
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Medicamentos y Servicios del Tratamiento
                  </Label>
                  <TreatmentItemsSelector
                    items={consultaData.treatmentItems}
                    onChange={(items) => setConsultaData(prev => ({ ...prev, treatmentItems: items }))}
                    specialtyId={appointment?.specialtyId}
                    prioritizeTags={specialtyTagIds}
                  />
                </div>

                {/* Notas del Tratamiento - 1 columna */}
                <div className="space-y-2 lg:col-span-1">
                  <Label htmlFor="tratamientoNotas" className="text-sm font-medium text-gray-700">
                    Notas del Tratamiento
                </Label>
                  <Textarea
                    id="tratamientoNotas"
                    value={consultaData.tratamientoNotas}
                    onChange={(e) => handleInputChange('tratamientoNotas', e.target.value)}
                    placeholder="Indicaciones médicas, recomendaciones, cuidados especiales..."
                    rows={6}
                    className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones" className="text-sm font-medium text-gray-700">
                  Observaciones Adicionales
                </Label>
                <Textarea
                  id="observaciones"
                  value={consultaData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales, seguimiento, etc..."
                  rows={3}
                  className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => router.push('/consulta-externa')}
                  disabled={saving}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !consultaData.sintomas.trim() || !consultaData.diagnostico.trim()}
                  className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                   {saving ? (
                     <>
                       <InlineSpinner size="sm" className="mr-2" />
                       Guardando...
                     </>
                   ) : (
                     <>
                       <Save size={16} className="mr-2" />
                       Guardar Consulta
                     </>
                   )}
                </Button>
                </div>
            </CardContent>
          </Card>

        {/* Modal de Preclínica */}
        {preclinica && (
        <Dialog open={isPreclinicaModalOpen} onOpenChange={setIsPreclinicaModalOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-xl text-[#2E9589]">
                <Activity size={24} />
                <span>Datos de Preclínica</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
                         {/* Signos Vitales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                             <Heart size={18} className="text-red-500 flex-shrink-0" />
                             <div>
                               <Label className="text-xs text-gray-600">Presión Arterial</Label>
                               <p className="text-sm font-medium">{preclinica.presionArterial}</p>
                             </div>
                           </div>
                           <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                             <Thermometer size={18} className="text-orange-500 flex-shrink-0" />
                             <div>
                               <Label className="text-xs text-gray-600">Temperatura</Label>
                               <p className="text-sm font-medium">{preclinica.temperatura}°C</p>
                             </div>
                           </div>
                           <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                             <Activity size={18} className="text-blue-500 flex-shrink-0" />
                             <div>
                               <Label className="text-xs text-gray-600">Frecuencia Cardíaca</Label>
                               <p className="text-sm font-medium">{preclinica.fc} lpm</p>
                             </div>
                           </div>
                           <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                             <Activity size={18} className="text-green-500 flex-shrink-0" />
                             <div>
                               <Label className="text-xs text-gray-600">Frecuencia Respiratoria</Label>
                               <p className="text-sm font-medium">{preclinica.fr} rpm</p>
                             </div>
                           </div>
                           <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                             <Heart size={18} className="text-purple-500 flex-shrink-0" />
                             <div>
                               <Label className="text-xs text-gray-600">Sat O₂</Label>
                               <p className="text-sm font-medium">{preclinica.satO2}%</p>
                             </div>
                           </div>
                           <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                             <Weight size={18} className="text-gray-500 flex-shrink-0" />
                             <div>
                               <Label className="text-xs text-gray-600">Peso</Label>
                               <p className="text-sm font-medium">{preclinica.peso} lbs</p>
                             </div>
                           </div>
                         <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                           <Ruler size={18} className="text-indigo-500 flex-shrink-0" />
                           <div>
                             <Label className="text-xs text-gray-600">Talla</Label>
                             <p className="text-sm font-medium">{preclinica.talla} cm</p>
                  </div>
                           </div>
                         </div>

                         {/* Evaluación Médica */}
                         {preclinica.examenFisico && (
                           <div>
                             <Label className="text-sm font-medium text-gray-700">Examen Físico</Label>
                  <p className="text-sm text-gray-900 mt-2 p-3 bg-gray-50 rounded-lg">{preclinica.examenFisico}</p>
                           </div>
                         )}

                         {preclinica.idc && (
                           <div>
                             <Label className="text-sm font-medium text-gray-700">IDC</Label>
                  <p className="text-sm text-gray-900 mt-2 p-3 bg-gray-50 rounded-lg">{preclinica.idc}</p>
                           </div>
                         )}

                         {preclinica.tx && (
                           <div>
                             <Label className="text-sm font-medium text-gray-700">Tratamiento Inicial</Label>
                  <p className="text-sm text-gray-900 mt-2 p-3 bg-gray-50 rounded-lg">{preclinica.tx}</p>
                           </div>
                         )}
                       </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Consultas Anteriores */}
      {previousConsultations.length > 0 && (
        <Dialog open={isConsultasPreviasModalOpen} onOpenChange={setIsConsultasPreviasModalOpen}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-xl text-[#2E9589]">
                <FileText size={24} />
                <span>Consultas Anteriores del Paciente</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="pt-4">
              <Accordion type="single" collapsible className="space-y-2">
                {previousConsultations.map((consultation, index) => (
                  <AccordionItem 
                    key={consultation.id} 
                    value={`consultation-${consultation.id}`}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:bg-[#2E9589]/5 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-[#2E9589] flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              #{previousConsultations.length - index}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900 text-sm">
                              {new Date(consultation.consultationDate).toLocaleDateString("es-ES", {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-600">
                              Dr. {consultation.doctor?.name}
                              {consultation.doctor?.specialty?.name && ` • ${consultation.doctor.specialty.name}`}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white ml-2">
                          {consultation.status === 'completed' ? 'Completada' : consultation.status}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2 space-y-3 bg-gray-50">
                    {/* Diagnóstico */}
                    {consultation.diagnosis && (
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                          <AlertCircle size={16} className="text-red-500" />
                          <span>Diagnóstico</span>
                </Label>
                        <p className="text-sm text-gray-900 bg-red-50 p-3 rounded border border-red-200">
                          {consultation.diagnosis}
                        </p>
              </div>
                    )}

                    {/* Enfermedad Actual */}
                    {consultation.currentIllness && (
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-gray-700">
                          Síntomas / Enfermedad Actual
                </Label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                          {consultation.currentIllness}
                        </p>
              </div>
                    )}

              {/* Tratamiento */}
                    {consultation.treatment && (
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                          <Stethoscope size={16} className="text-[#2E9589]" />
                          <span>Tratamiento Indicado</span>
                        </Label>
                        <p className="text-sm text-gray-900 bg-green-50 p-3 rounded border border-green-200">
                          {consultation.treatment}
                        </p>
                      </div>
                    )}

                    {/* Items/Medicamentos */}
                    {consultation.items && consultation.items.length > 0 && (
              <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                          <Package size={16} />
                          <span>Medicamentos y Servicios ({consultation.items.length})</span>
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {consultation.items.map((item: { id: string; nombre: string; quantity: number; precioUnitario: number }) => (
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
                    {consultation.vitalSigns && (
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center space-x-1">
                          <Activity size={16} className="text-blue-500" />
                          <span>Signos Vitales</span>
                </Label>
                        <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded border border-blue-200">
                          {consultation.vitalSigns}
                        </p>
              </div>
                    )}

              {/* Observaciones */}
                    {consultation.observations && (
                      <div className="space-y-1">
                        <Label className="text-sm font-semibold text-gray-700">
                          Observaciones
                </Label>
                        <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200 italic">
                          {consultation.observations}
                        </p>
              </div>
                    )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Documentos Médicos */}
      <MedicalDocumentModal
        isOpen={isMedicalDocumentModalOpen}
        onClose={() => setIsMedicalDocumentModalOpen(false)}
        patientId={patient.id}
        onSuccess={() => {
          toast({
            title: 'Documento generado',
            description: 'El documento médico se ha generado exitosamente',
            variant: 'success',
          });
        }}
      />
      </div>
    </div>
  );
}
