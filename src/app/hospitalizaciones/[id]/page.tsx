"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { HospitalizationWithRelations } from "@/types/hospitalization";
import { getDailyRate } from "@/lib/hospitalization-helpers";
import PreclinicaModal from "@/components/PreclinicaModal";
import InsulinControlModal from "@/components/InsulinControlModal";
import IntakeOutputModal from "@/components/IntakeOutputModal";
import ExamenFisicoModal from "@/components/ExamenFisicoModal";
import MedicationControlModal from "@/components/MedicationControlModal";
import NursingNoteModal from "@/components/NursingNoteModal";
import AdmissionRecordModal from "@/components/AdmissionRecordModal";
import DischargeRecordModal from "@/components/DischargeRecordModal";
import { PreclinicaData } from "@/types/components";
import { CreateMedicationControlData, CreateExamenFisicoData, CreateNursingNoteData, CreateAdmissionRecordData, CreateDischargeRecordData } from "@/types/hospitalization";
import HospitalizationHeader from "@/components/hospitalizaciones/HospitalizationHeader";
import TimelineTab from "@/components/hospitalizaciones/TimelineTab";
import VitalsTab from "@/components/hospitalizaciones/VitalsTab";
import InsulinTab from "@/components/hospitalizaciones/InsulinTab";
import IntakeOutputTab from "@/components/hospitalizaciones/IntakeOutputTab";
import ExamenFisicoTab from "@/components/hospitalizaciones/ExamenFisicoTab";
import MedicationTab from "@/components/hospitalizaciones/MedicationTab";
import MedicalDocumentModal from "@/components/MedicalDocumentModal";
import HospitalizationRateModal from "@/components/hospitalizaciones/HospitalizationRateModal";

export default function HospitalizacionDetallesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [hospitalization, setHospitalization] = useState<HospitalizationWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreclinicaModalOpen, setIsPreclinicaModalOpen] = useState(false);
  const [isInsulinControlModalOpen, setIsInsulinControlModalOpen] = useState(false);
  const [isIntakeOutputModalOpen, setIsIntakeOutputModalOpen] = useState(false);
  const [isExamenFisicoModalOpen, setIsExamenFisicoModalOpen] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isNursingNoteModalOpen, setIsNursingNoteModalOpen] = useState(false);
  const [isAdmissionRecordModalOpen, setIsAdmissionRecordModalOpen] = useState(false);
  const [isDischargeRecordModalOpen, setIsDischargeRecordModalOpen] = useState(false);
  const [isMedicalDocumentModalOpen, setIsMedicalDocumentModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadHospitalization();
    }
  }, [params.id]);

  useEffect(() => {
    if (user && !["admin", "recepcion", "especialista", "medico_sala"].includes(user.role?.name || "")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const loadHospitalization = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hospitalizations/${params.id}`);
      if (!response.ok) throw new Error("Error al cargar hospitalización");

      const data = await response.json();
      setHospitalization(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la hospitalización",
        variant: "error",
      });
      router.push("/hospitalizaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreclinica = async (hospitalizationId: string, preclinicaData: PreclinicaData) => {
    try {
      const response = await fetch(`/api/hospitalizations/${hospitalizationId}/preclinicas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preclinicaData),
      });

      if (!response.ok) throw new Error("Error al guardar preclínica");

      toast({
        title: "Éxito",
        description: "Signos vitales registrados exitosamente",
      });

      loadHospitalization();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los signos vitales",
        variant: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!hospitalization) {
    return null;
  }

  const dailyRate = getDailyRate(hospitalization.dailyRateItem, hospitalization.dailyRateVariant);
  const isActive = hospitalization.status === "iniciada";
  const hasDailyRateVariants = (hospitalization.dailyRateItem?.variants?.length || 0) > 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Card Principal */}
      <Card className="bg-white border-gray-200">
        <HospitalizationHeader
          hospitalization={hospitalization}
          isActive={isActive}
          onDischarge={() => setIsDischargeRecordModalOpen(true)}
          onEmitDocument={() => setIsMedicalDocumentModalOpen(true)}
          onChangeDailyRate={isActive && hasDailyRateVariants ? () => setIsRateModalOpen(true) : undefined}
        />

        {/* Tabs */}
        <CardContent className="pt-6">
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>
              <TabsTrigger value="preclinicas">
                Signos Vitales ({hospitalization.preclinicas?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="insulin">
                Control de Insulina ({hospitalization.insulinControls?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="medication">
                Medicamentos ({hospitalization.medicationControls?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="intakeOutput">
                Ingestas y Excretas ({hospitalization.intakeOutputControls?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="examenFisico">
                Examen Físico ({hospitalization.examenFisicos?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* TAB: Línea de Tiempo */}
            <TabsContent value="timeline">
              <TimelineTab
                hospitalization={hospitalization}
                isActive={isActive}
                onRegisterVitals={() => setIsPreclinicaModalOpen(true)}
                onRegisterInsulin={() => setIsInsulinControlModalOpen(true)}
                onRegisterIntakeOutput={() => setIsIntakeOutputModalOpen(true)}
        onRegisterExamenFisico={() => setIsExamenFisicoModalOpen(true)}
        onRegisterMedication={() => setIsMedicationModalOpen(true)}
        onRegisterNursingNote={() => setIsNursingNoteModalOpen(true)}
        onViewAdmissionRecord={() => setIsAdmissionRecordModalOpen(true)}
        onDischarge={() => setIsDischargeRecordModalOpen(true)}
              />
            </TabsContent>

            {/* TAB: Signos Vitales */}
            <TabsContent value="preclinicas">
              <VitalsTab
                hospitalization={hospitalization}
                isActive={isActive}
                onRegisterVitals={() => setIsPreclinicaModalOpen(true)}
              />
            </TabsContent>

            {/* TAB: Control de Insulina */}
            <TabsContent value="insulin">
              <InsulinTab
                hospitalization={hospitalization}
                isActive={isActive}
                onRegisterInsulin={() => setIsInsulinControlModalOpen(true)}
              />
            </TabsContent>

            {/* TAB: Control de Medicamentos */}
            <TabsContent value="medication">
              <MedicationTab
                hospitalization={hospitalization}
                isActive={isActive}
                onRegisterMedication={() => setIsMedicationModalOpen(true)}
              />
            </TabsContent>

            {/* TAB: Ingestas y Excretas */}
            <TabsContent value="intakeOutput">
              <IntakeOutputTab
                hospitalization={hospitalization}
                isActive={isActive}
                onRegisterIntakeOutput={() => setIsIntakeOutputModalOpen(true)}
              />
            </TabsContent>

            {/* TAB: Examen Físico */}
            <TabsContent value="examenFisico">
              <ExamenFisicoTab
                hospitalization={hospitalization}
                isActive={isActive}
                onRegisterExamenFisico={() => setIsExamenFisicoModalOpen(true)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modales */}
      <PreclinicaModal
        isOpen={isPreclinicaModalOpen}
        onClose={() => setIsPreclinicaModalOpen(false)}
        hospitalizationId={hospitalization.id}
        onSave={handleSavePreclinica}
      />

      <InsulinControlModal
        isOpen={isInsulinControlModalOpen}
        onClose={() => setIsInsulinControlModalOpen(false)}
        hospitalizationId={hospitalization.id}
        onSave={() => {
          loadHospitalization();
          toast({
            title: "Éxito",
            description: "Control de insulina registrado correctamente",
          });
        }}
      />

      <IntakeOutputModal
        isOpen={isIntakeOutputModalOpen}
        onClose={() => setIsIntakeOutputModalOpen(false)}
        hospitalizationId={hospitalization.id}
        onSave={() => {
          loadHospitalization();
          toast({
            title: "Éxito",
            description: "Ingesta/Excreta registrada correctamente",
          });
        }}
      />

      <ExamenFisicoModal
        isOpen={isExamenFisicoModalOpen}
        onClose={() => setIsExamenFisicoModalOpen(false)}
        hospitalizationId={hospitalization.id}
        onSave={async (id, examenFisicoData: CreateExamenFisicoData) => {
          try {
            const response = await fetch(`/api/hospitalizations/${id}/examen-fisicos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(examenFisicoData),
            });

            if (!response.ok) throw new Error("Error al guardar examen físico");

            loadHospitalization();
            toast({
              title: "Éxito",
              description: "Examen físico registrado correctamente",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "No se pudo guardar el examen físico",
              variant: "error",
            });
          }
        }}
      />

      <MedicationControlModal
        isOpen={isMedicationModalOpen}
        onClose={() => setIsMedicationModalOpen(false)}
        hospitalizationId={hospitalization.id}
        onSave={async (id, medicationData: CreateMedicationControlData) => {
          try {
            const response = await fetch(`/api/hospitalizations/${id}/medication-controls`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(medicationData),
            });

            if (!response.ok) throw new Error("Error al guardar control de medicamentos");

            loadHospitalization();
            toast({
              title: "Éxito",
              description: "Control de medicamentos registrado correctamente",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "No se pudo guardar el control de medicamentos",
              variant: "error",
            });
          }
        }}
      />

      <NursingNoteModal
        isOpen={isNursingNoteModalOpen}
        onClose={() => setIsNursingNoteModalOpen(false)}
        hospitalizationId={hospitalization.id}
        onSave={async (id, nursingNoteData: CreateNursingNoteData) => {
          try {
            const response = await fetch(`/api/hospitalizations/${id}/nursing-notes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(nursingNoteData),
            });

            if (!response.ok) throw new Error("Error al guardar nota de enfermería");

            loadHospitalization();
            toast({
              title: "Éxito",
              description: "Nota de enfermería registrada correctamente",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "No se pudo guardar la nota de enfermería",
              variant: "error",
            });
          }
        }}
      />

      <AdmissionRecordModal
        isOpen={isAdmissionRecordModalOpen}
        onClose={() => setIsAdmissionRecordModalOpen(false)}
        hospitalizationId={hospitalization.id}
        existingRecord={hospitalization.admissionRecord}
        onSave={async (id, admissionData: CreateAdmissionRecordData) => {
          try {
            const method = hospitalization.admissionRecord ? "PUT" : "POST";
            const response = await fetch(`/api/hospitalizations/${id}/admission-record`, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(admissionData),
            });

            if (!response.ok) throw new Error("Error al guardar registro de admisión");

            loadHospitalization();
            toast({
              title: "Éxito",
              description: hospitalization.admissionRecord 
                ? "Registro de admisión actualizado correctamente"
                : "Registro de admisión creado correctamente",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: "No se pudo guardar el registro de admisión",
              variant: "error",
            });
          }
        }}
      />

      <DischargeRecordModal
        isOpen={isDischargeRecordModalOpen}
        onClose={() => setIsDischargeRecordModalOpen(false)}
        hospitalizationId={hospitalization.id}
        existingRecord={hospitalization.dischargeRecord}
        admissionDate={hospitalization.admissionDate}
        dailyRate={getDailyRate(hospitalization.dailyRateItem, hospitalization.dailyRateVariant)}
        onSave={async (id, dischargeData: CreateDischargeRecordData) => {
          try {
            const response = await fetch(`/api/hospitalizations/${id}/discharge-record`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(dischargeData),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Error al procesar el alta");
            }

            loadHospitalization();
            toast({
              title: "Éxito",
              description: "Paciente dado de alta correctamente",
            });
          } catch (error) {
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "No se pudo procesar el alta",
              variant: "error",
            });
          }
        }}
      />

      <MedicalDocumentModal
        isOpen={isMedicalDocumentModalOpen}
        onClose={() => setIsMedicalDocumentModalOpen(false)}
        patientId={hospitalization.patient.id}
        onSuccess={() => {
          toast({
            title: 'Documento generado',
            description: 'El documento médico se ha generado exitosamente',
            variant: 'success',
          });
        }}
      />
      <HospitalizationRateModal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        hospitalization={hospitalization}
        onSuccess={() => {
          setIsRateModalOpen(false);
          loadHospitalization();
        }}
      />
    </div>
  );
}
