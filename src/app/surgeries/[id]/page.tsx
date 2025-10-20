"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  Activity,
  FileText,
  ClipboardList,
  Package,
  Clock,
  Shield,
  Pill,
  CheckCircle,
  Plus,
  Scissors,
  FilePlus,
} from "lucide-react";
import { SurgeryWithRelations, SurgeryStatus } from "@/types/surgery";
import OperativeNoteModal from "@/components/OperativeNoteModal";
import SurgeryMedicalOrdersModal from "@/components/SurgeryMedicalOrdersModal";
import MaterialControlModal from "@/components/MaterialControlModal";
import OperatingRoomRequestModal from "@/components/OperatingRoomRequestModal";
import SafetyChecklistEntradaModal from "@/components/SafetyChecklistEntradaModal";
import SafetyChecklistPausaModal from "@/components/SafetyChecklistPausaModal";
import SafetyChecklistSalidaModal from "@/components/SafetyChecklistSalidaModal";
import UsedMaterialsModal from "@/components/UsedMaterialsModal";
import AnesthesiaRecordModal from "@/components/AnesthesiaRecordModal";
import AnesthesiaGridPreview from "@/components/AnesthesiaGridPreview";
import MedicalDocumentModal from "@/components/MedicalDocumentModal";

export default function SurgeryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [surgery, setSurgery] = useState<SurgeryWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados de modales
  const [isOperativeNoteModalOpen, setIsOperativeNoteModalOpen] = useState(false);
  const [isMedicalOrdersModalOpen, setIsMedicalOrdersModalOpen] = useState(false);
  const [isMaterialControlModalOpen, setIsMaterialControlModalOpen] = useState(false);
  const [materialControlMoment, setMaterialControlMoment] = useState<'pre' | 'trans' | 'final'>('pre');
  const [isOperatingRoomModalOpen, setIsOperatingRoomModalOpen] = useState(false);
  const [isSafetyEntradaModalOpen, setIsSafetyEntradaModalOpen] = useState(false);
  const [isSafetyPausaModalOpen, setIsSafetyPausaModalOpen] = useState(false);
  const [isSafetySalidaModalOpen, setIsSafetySalidaModalOpen] = useState(false);
  const [isUsedMaterialsModalOpen, setIsUsedMaterialsModalOpen] = useState(false);
  const [isAnesthesiaRecordModalOpen, setIsAnesthesiaRecordModalOpen] = useState(false);
  const [isMedicalDocumentModalOpen, setIsMedicalDocumentModalOpen] = useState(false);

  useEffect(() => {
    if (user && !["admin", "recepcion", "especialista"].includes(user.role?.name || "")) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (params.id) {
      loadSurgery();
    }
  }, [params.id]);

  const loadSurgery = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/surgeries/${params.id}`);
      if (!response.ok) throw new Error("Error al cargar cirugía");

      const data = await response.json();
      setSurgery(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la cirugía",
        variant: "error",
      });
      router.push("/surgeries");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSurgery = async () => {
    try {
      const response = await fetch(`/api/surgeries/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "finalizada" }),
      });

      if (!response.ok) throw new Error("Error al finalizar cirugía");

      toast({
        title: "Éxito",
        description: "Cirugía finalizada exitosamente",
      });

      loadSurgery();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo finalizar la cirugía",
        variant: "error",
      });
    }
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
      <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading || !surgery) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const isActive = surgery.status === "iniciada";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Botón volver */}

      {/* Card Principal */}
      <Card className="bg-white border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E9589] to-[#2E9589]/80 p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="bg-white p-3 rounded-full">
                <Scissors className="h-8 w-8 text-[#2E9589]" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">
                  {surgery.patient?.firstName} {surgery.patient?.lastName}
                </h1>
                <p className="text-white/80 mt-1">
                  {surgery.patient?.identityNumber}
                </p>
                <p className="mt-2 font-medium">{surgery.surgeryItem?.name}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {getStatusBadge(surgery.status)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMedicalDocumentModalOpen(true)}
                className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Emitir Documento
              </Button>
              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFinalizeSurgery}
                  className="bg-white text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Cirugía
                </Button>
              )}
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-white/80 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Fecha de Registro</span>
              </div>
              <p className="text-white font-semibold">
                {new Date(surgery.createdAt).toLocaleDateString("es-HN")}
              </p>
            </div>

            {surgery.completedDate && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 text-white/80 mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Fecha Finalizada</span>
                </div>
                <p className="text-white font-semibold">
                  {new Date(surgery.completedDate).toLocaleDateString("es-HN")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <CardContent className="pt-6">
          <Tabs defaultValue="nota-operatoria" className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-6">
              <TabsTrigger value="nota-operatoria">Nota Operatoria</TabsTrigger>
              <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
              <TabsTrigger value="anestesia">Anestesia</TabsTrigger>
              <TabsTrigger value="materiales">Control Materiales</TabsTrigger>
              <TabsTrigger value="quirofano">Quirófano</TabsTrigger>
              <TabsTrigger value="verificacion">Verificación</TabsTrigger>
              <TabsTrigger value="utilizados">Materiales Usados</TabsTrigger>
            </TabsList>

            {/* TAB: Nota Operatoria */}
            <TabsContent value="nota-operatoria">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Nota Operatoria</h3>
                  <Button
                    onClick={() => setIsOperativeNoteModalOpen(true)}
                    className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {surgery.operativeNote ? "Editar Nota" : "Registrar Nota"}
                  </Button>
                </div>
                
                {surgery.operativeNote ? (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Diagnóstico Preoperatorio</Label>
                          <p className="text-sm text-gray-600 mt-1">{surgery.operativeNote.diagnosticoPreoperatorio}</p>
                        </div>
                        {surgery.operativeNote.hallazgos && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Hallazgos</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.operativeNote.hallazgos}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay nota operatoria registrada</p>
                    <p className="text-sm text-gray-400 mt-1">Haz clic en &quot;Registrar Nota&quot; para comenzar</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: Órdenes y Anotaciones */}
            <TabsContent value="ordenes">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Órdenes y Anotaciones Médicas</h3>
                  <Button
                    onClick={() => setIsMedicalOrdersModalOpen(true)}
                    className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {surgery.medicalOrders ? "Editar" : "Registrar"}
                  </Button>
                </div>
                
                {surgery.medicalOrders ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Anotaciones */}
                    <Card className="bg-white border-gray-200">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-[#2E9589]" />
                          Anotaciones
                        </h4>
                        {surgery.medicalOrders.anotaciones && surgery.medicalOrders.anotaciones.length > 0 ? (
                          <ul className="space-y-2">
                            {surgery.medicalOrders.anotaciones.map((anotacion, idx) => (
                              <li key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-[#2E9589]">
                                {anotacion.content}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Sin anotaciones</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Órdenes */}
                    <Card className="bg-white border-gray-200">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          Órdenes
                        </h4>
                        {surgery.medicalOrders.ordenes && surgery.medicalOrders.ordenes.length > 0 ? (
                          <ul className="space-y-2">
                            {surgery.medicalOrders.ordenes.map((orden, idx) => (
                              <li key={idx} className="text-sm text-gray-600 pl-4 border-l-2 border-blue-600">
                                {orden.content}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Sin órdenes</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay órdenes registradas</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: Anestesia */}
            <TabsContent value="anestesia">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Registro de Anestesia</h3>
                  <Button
                    onClick={() => setIsAnesthesiaRecordModalOpen(true)}
                    className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {surgery.anesthesiaRecord ? "Editar" : "Registrar"}
                  </Button>
                </div>
                
                {surgery.anesthesiaRecord ? (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {surgery.anesthesiaRecord.premedicacion && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Premedicación</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.premedicacion}</p>
                          </div>
                        )}
                        {surgery.anesthesiaRecord.estadoFisico && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Estado Físico</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.estadoFisico}</p>
                          </div>
                        )}
                        {surgery.anesthesiaRecord.pronosticoOperatorio && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Pronóstico Operatorio</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.pronosticoOperatorio}</p>
                          </div>
                        )}
                        {surgery.anesthesiaRecord.tiempoDuracionAnestesia && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Duración de Anestesia</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.tiempoDuracionAnestesia}</p>
                          </div>
                        )}
                        {surgery.anesthesiaRecord.operacion && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Operación</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.operacion}</p>
                          </div>
                        )}
                        {surgery.anesthesiaRecord.cirujano && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Cirujano</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.cirujano}</p>
                          </div>
                        )}
                        {surgery.anesthesiaRecord.anestesiologo && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Anestesiólogo</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.anestesiologo}</p>
                          </div>
                        )}
                        {surgery.anesthesiaRecord.agentesTecnicas && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Agentes y Técnicas</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.agentesTecnicas}</p>
                          </div>
                        )}
                        {surgery.anesthesiaRecord.resumenLiquidos && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Resumen de Líquidos</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.resumenLiquidos}</p>
                          </div>
                        )}
                        {surgery.anesthesiaRecord.complicaciones && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Complicaciones</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.anesthesiaRecord.complicaciones}</p>
                          </div>
                        )}
                      </div>

                      {/* Gráfico de Monitoreo */}
                      {surgery.anesthesiaRecord.gridData && (
                        <div className="mt-6 pt-4 border-t">
                          <Label className="text-sm font-medium text-gray-700 mb-3 block">Gráfico de Monitoreo</Label>
                          <AnesthesiaGridPreview gridData={surgery.anesthesiaRecord.gridData} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay registro de anestesia</p>
                    <p className="text-sm text-gray-400 mt-1">Haz clic en &quot;Registrar&quot; para comenzar</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: Control de Materiales */}
            <TabsContent value="materiales">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Control de Materiales e Instrumentos</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => { setMaterialControlMoment('pre'); setIsMaterialControlModalOpen(true); }}
                      size="sm"
                      variant="outline"
                      className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589] hover:text-white"
                    >
                      Pre
                    </Button>
                    <Button
                      onClick={() => { setMaterialControlMoment('trans'); setIsMaterialControlModalOpen(true); }}
                      size="sm"
                      variant="outline"
                      className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589] hover:text-white"
                    >
                      Trans
                    </Button>
                    <Button
                      onClick={() => { setMaterialControlMoment('final'); setIsMaterialControlModalOpen(true); }}
                      size="sm"
                      variant="outline"
                      className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589] hover:text-white"
                    >
                      Final
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Registros: Pre-quirúrgico, Trans-quirúrgico y Final</p>
              </div>
            </TabsContent>

            {/* TAB: Solicitud de Quirófano */}
            <TabsContent value="quirofano">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Solicitud de Quirófano</h3>
                  <Button
                    onClick={() => setIsOperatingRoomModalOpen(true)}
                    className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {surgery.operatingRoomRequest ? "Editar" : "Registrar"}
                  </Button>
                </div>
                
                {surgery.operatingRoomRequest ? (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Diagnóstico Pre-operatorio</Label>
                          <p className="text-sm text-gray-600 mt-1">{surgery.operatingRoomRequest.diagnosticoPreoperatorio}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Tipo de Anestesia</Label>
                          <p className="text-sm text-gray-600 mt-1">{surgery.operatingRoomRequest.tipoAnestesia || "—"}</p>
                        </div>
                        {surgery.operatingRoomRequest.medicoSolicitante && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Médico Solicitante</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.operatingRoomRequest.medicoSolicitante}</p>
                          </div>
                        )}
                        {surgery.operatingRoomRequest.observaciones && (
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium text-gray-700">Observaciones</Label>
                            <p className="text-sm text-gray-600 mt-1">{surgery.operatingRoomRequest.observaciones}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay solicitud registrada</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB: Lista de Verificación */}
            <TabsContent value="verificacion">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Lista de Verificación de Cirugía Segura</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white border-gray-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsSafetyEntradaModalOpen(true)}>
                    <CardContent className="pt-6 text-center">
                      <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">Entrada</p>
                      <p className="text-xs text-gray-500">Antes de anestesia</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsSafetyPausaModalOpen(true)}>
                    <CardContent className="pt-6 text-center">
                      <Shield className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">Pausa</p>
                      <p className="text-xs text-gray-500">Antes de incisión</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsSafetySalidaModalOpen(true)}>
                    <CardContent className="pt-6 text-center">
                      <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="font-medium text-gray-900">Salida</p>
                      <p className="text-xs text-gray-500">Cierre quirúrgico</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB: Materiales Utilizados */}
            <TabsContent value="utilizados">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Materiales Utilizados en Cirugía</h3>
                  <Button
                    onClick={() => setIsUsedMaterialsModalOpen(true)}
                    className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {surgery.usedMaterials ? "Editar" : "Registrar"}
                  </Button>
                </div>
                
                {surgery.usedMaterials ? (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {surgery.usedMaterials.gasas && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Gasas:</span>
                            <span className="ml-2 text-gray-600">{surgery.usedMaterials.gasas}</span>
                          </div>
                        )}
                        {surgery.usedMaterials.torundas && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Torundas:</span>
                            <span className="ml-2 text-gray-600">{surgery.usedMaterials.torundas}</span>
                          </div>
                        )}
                        {surgery.usedMaterials.compresas && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Compresas:</span>
                            <span className="ml-2 text-gray-600">{surgery.usedMaterials.compresas}</span>
                          </div>
                        )}
                        {surgery.usedMaterials.suturas && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Suturas:</span>
                            <span className="ml-2 text-gray-600">{surgery.usedMaterials.suturas}</span>
                          </div>
                        )}
                        {surgery.usedMaterials.jeringas && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Jeringas:</span>
                            <span className="ml-2 text-gray-600">{surgery.usedMaterials.jeringas}</span>
                          </div>
                        )}
                        {surgery.usedMaterials.otros && (
                          <div className="text-sm col-span-2 md:col-span-3 lg:col-span-4">
                            <span className="font-medium text-gray-700">Otros:</span>
                            <span className="ml-2 text-gray-600">{surgery.usedMaterials.otros}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay materiales registrados</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modales */}
      <OperativeNoteModal
        isOpen={isOperativeNoteModalOpen}
        onClose={() => setIsOperativeNoteModalOpen(false)}
        onSave={loadSurgery}
        surgeryId={params.id as string}
        existingNote={surgery.operativeNote || undefined}
      />

      <SurgeryMedicalOrdersModal
        isOpen={isMedicalOrdersModalOpen}
        onClose={() => setIsMedicalOrdersModalOpen(false)}
        onSave={loadSurgery}
        surgeryId={params.id as string}
        existingOrders={surgery.medicalOrders || undefined}
      />

      <MaterialControlModal
        isOpen={isMaterialControlModalOpen}
        onClose={() => setIsMaterialControlModalOpen(false)}
        onSave={loadSurgery}
        surgeryId={params.id as string}
        moment={materialControlMoment}
      />

      <OperatingRoomRequestModal
        isOpen={isOperatingRoomModalOpen}
        onClose={() => setIsOperatingRoomModalOpen(false)}
        onSave={loadSurgery}
        surgeryId={params.id as string}
        existingRequest={surgery.operatingRoomRequest || undefined}
      />

      <SafetyChecklistEntradaModal
        isOpen={isSafetyEntradaModalOpen}
        onClose={() => setIsSafetyEntradaModalOpen(false)}
        onSave={loadSurgery}
        surgeryId={params.id as string}
        existingChecklist={surgery.safetyChecklist?.entrada || undefined}
      />

      <SafetyChecklistPausaModal
        isOpen={isSafetyPausaModalOpen}
        onClose={() => setIsSafetyPausaModalOpen(false)}
        onSave={loadSurgery}
        surgeryId={params.id as string}
        existingChecklist={surgery.safetyChecklist?.pausa || undefined}
      />

      <SafetyChecklistSalidaModal
        isOpen={isSafetySalidaModalOpen}
        onClose={() => setIsSafetySalidaModalOpen(false)}
        onSave={loadSurgery}
        surgeryId={params.id as string}
        existingChecklist={surgery.safetyChecklist?.salida || undefined}
      />

      <UsedMaterialsModal
        isOpen={isUsedMaterialsModalOpen}
        onClose={() => setIsUsedMaterialsModalOpen(false)}
        onSave={loadSurgery}
        surgeryId={params.id as string}
        existingMaterials={surgery.usedMaterials || undefined}
      />

      <AnesthesiaRecordModal
        isOpen={isAnesthesiaRecordModalOpen}
        onClose={() => setIsAnesthesiaRecordModalOpen(false)}
        onSave={loadSurgery}
        surgeryId={params.id as string}
        existingRecord={surgery.anesthesiaRecord || undefined}
      />

      <MedicalDocumentModal
        isOpen={isMedicalDocumentModalOpen}
        onClose={() => setIsMedicalDocumentModalOpen(false)}
        patientId={surgery.patient?.id || ''}
        onSuccess={() => {
          toast({
            title: 'Documento generado',
            description: 'El documento médico se ha generado exitosamente',
            variant: 'success',
          });
        }}
      />
    </div>
  );
}

