"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Bed,
  DollarSign,
  FileText,
  Activity,
  LogOut,
  X,
} from "lucide-react";
import { HospitalizationDetailsModalProps, HospitalizationWithRelations } from "@/types/hospitalization";
import { calculateHospitalizationCost, formatDaysOfStay, getDailyRate } from "@/lib/hospitalization-helpers";
import DischargeModal from "@/components/DischargeModal";

// Interfaz extendida para incluir campos adicionales de la API
interface HospitalizationWithPaymentInfo extends Omit<HospitalizationWithRelations, 'salaDoctor'> {
  medicoSalaUser?: {
    id: string;
    name: string;
    username: string;
  } | null;
  pendingDays?: {
    daysCount: number;
    startDate: string;
    endDate: string;
    hasPendingDays: boolean;
    estimatedCost: number;
  };
  paymentSummary?: {
    totalPaid: number;
    totalPending: number;
    totalPayments: number;
    pendingPaymentsCount: number;
  };
}

export default function HospitalizationDetailsModal({
  isOpen,
  onClose,
  hospitalization,
  onUpdate,
}: HospitalizationDetailsModalProps) {
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);

  if (!hospitalization) return null;

  const dailyRate = getDailyRate(hospitalization.dailyRateItem, hospitalization.dailyRateVariant);
  const costCalc = dailyRate > 0
    ? calculateHospitalizationCost(
        hospitalization.admissionDate,
        dailyRate,
        hospitalization.dischargeDate
      )
    : null;

  const isActive = hospitalization.status === "iniciada";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#2E9589]" />
              Detalles de Hospitalización
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="preclinicas">
                Preclínicas ({hospitalization.preclinicas?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="acciones">Acciones</TabsTrigger>
            </TabsList>

            {/* Tab Información */}
            <TabsContent value="info" className="space-y-4">
              {/* Información del Paciente */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Paciente
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Nombre</p>
                      <p className="font-medium">
                        {hospitalization.patient.firstName} {hospitalization.patient.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Identidad</p>
                      <p className="font-medium">{hospitalization.patient.identityNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Edad</p>
                      <p className="font-medium">
                        {new Date().getFullYear() - new Date(hospitalization.patient.birthDate).getFullYear()} años
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sexo</p>
                      <p className="font-medium">{hospitalization.patient.gender}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de Hospitalización */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    Hospitalización
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Médico de Sala Responsable</p>
                      <p className="font-medium">{(hospitalization as HospitalizationWithPaymentInfo).medicoSalaUser?.name || 'No asignado'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Habitación</p>
                      <p className="font-medium">
                        {hospitalization.room ? `Habitación ${hospitalization.room.number}` : "Sin asignar"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fecha de Ingreso</p>
                      <p className="font-medium">
                        {new Date(hospitalization.admissionDate).toLocaleString("es-HN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Días de Estancia</p>
                      <p className="font-medium">
                        {costCalc ? formatDaysOfStay(costCalc.daysOfStay) : "N/A"}
                      </p>
                    </div>
                    {hospitalization.dischargeDate && (
                      <div>
                        <p className="text-gray-500">Fecha de Alta</p>
                        <p className="font-medium">
                          {new Date(hospitalization.dischargeDate).toLocaleString("es-HN")}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500">Estado</p>
                      <p className="font-medium capitalize">{hospitalization.status}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información de Costos */}
              {costCalc && (
                <Card className="border-[#2E9589]">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#2E9589]" />
                      Costos
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Servicio Diario</p>
                        <p className="font-medium">
                          {hospitalization.dailyRateItem?.name || "N/A"}
                          {hospitalization.dailyRateVariant && (
                            <span className="text-xs text-gray-500 block">
                              Variante: {hospitalization.dailyRateVariant.name}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tarifa Diaria</p>
                        <p className="font-medium">L{costCalc.dailyRate.toFixed(2)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Total Acumulado</p>
                        <p className="text-2xl font-bold text-[#2E9589]">
                          L{costCalc.totalCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {costCalc.daysOfStay} día{costCalc.daysOfStay !== 1 ? "s" : ""} × L{costCalc.dailyRate.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Información de Días Pendientes y Pagos (si está disponible) */}
              {(hospitalization as HospitalizationWithPaymentInfo).pendingDays || (hospitalization as HospitalizationWithPaymentInfo).paymentSummary ? (
                <Card className="border-blue-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      Estado de Pagos
                    </h3>
                    
                    {/* Días Pendientes */}
                    {(hospitalization as HospitalizationWithPaymentInfo).pendingDays && (hospitalization as HospitalizationWithPaymentInfo).pendingDays?.hasPendingDays && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Días Pendientes de Pago:</span>
                          <span className="text-lg font-bold text-yellow-700">
                            {(hospitalization as HospitalizationWithPaymentInfo).pendingDays?.daysCount} día{((hospitalization as HospitalizationWithPaymentInfo).pendingDays?.daysCount || 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Desde: {new Date((hospitalization as HospitalizationWithPaymentInfo).pendingDays?.startDate || '').toLocaleDateString('es-ES')} hasta: {new Date((hospitalization as HospitalizationWithPaymentInfo).pendingDays?.endDate || '').toLocaleDateString('es-ES')}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-2">
                          Costo estimado: <span className="text-[#2E9589]">L{((hospitalization as HospitalizationWithPaymentInfo).pendingDays?.estimatedCost || 0).toFixed(2)}</span>
                        </p>
                      </div>
                    )}

                    {/* Resumen de Pagos */}
                    {(hospitalization as HospitalizationWithPaymentInfo).paymentSummary && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Total Pagado</p>
                          <p className="font-medium text-green-600">
                            L{((hospitalization as HospitalizationWithPaymentInfo).paymentSummary?.totalPaid || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Pendiente</p>
                          <p className="font-medium text-yellow-600">
                            L{((hospitalization as HospitalizationWithPaymentInfo).paymentSummary?.totalPending || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pagos Totales</p>
                          <p className="font-medium">{((hospitalization as HospitalizationWithPaymentInfo).paymentSummary?.totalPayments || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pagos Pendientes</p>
                          <p className="font-medium">{((hospitalization as HospitalizationWithPaymentInfo).paymentSummary?.pendingPaymentsCount || 0)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {/* Diagnóstico y Notas */}
              {(hospitalization.diagnosis || hospitalization.notes) && (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {hospitalization.diagnosis && (
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Diagnóstico</p>
                        <p className="text-sm">{hospitalization.diagnosis}</p>
                      </div>
                    )}
                    {hospitalization.notes && (
                      <div>
                        <p className="text-gray-500 text-sm mb-1">Notas</p>
                        <p className="text-sm whitespace-pre-wrap">{hospitalization.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Preclínicas */}
            <TabsContent value="preclinicas" className="space-y-4">
              {hospitalization.preclinicas && hospitalization.preclinicas.length > 0 ? (
                <div className="space-y-3">
                  {hospitalization.preclinicas.map((preclinica, index) => (
                    <Card key={preclinica.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900">
                            Preclínica #{hospitalization.preclinicas!.length - index}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {new Date(preclinica.createdAt).toLocaleString("es-HN")}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          {preclinica.presionArterial && (
                            <div>
                              <p className="text-gray-500">Presión Arterial</p>
                              <p className="font-medium">{preclinica.presionArterial}</p>
                            </div>
                          )}
                          {preclinica.temperatura && (
                            <div>
                              <p className="text-gray-500">Temperatura</p>
                              <p className="font-medium">{preclinica.temperatura}°C</p>
                            </div>
                          )}
                          {preclinica.fc && (
                            <div>
                              <p className="text-gray-500">FC</p>
                              <p className="font-medium">{preclinica.fc} lpm</p>
                            </div>
                          )}
                          {preclinica.fr && (
                            <div>
                              <p className="text-gray-500">FR</p>
                              <p className="font-medium">{preclinica.fr} rpm</p>
                            </div>
                          )}
                          {preclinica.satO2 && (
                            <div>
                              <p className="text-gray-500">SatO2</p>
                              <p className="font-medium">{preclinica.satO2}%</p>
                            </div>
                          )}
                          {preclinica.peso && (
                            <div>
                              <p className="text-gray-500">Peso</p>
                              <p className="font-medium">{preclinica.peso} lb</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No hay preclínicas registradas</p>
                </div>
              )}
            </TabsContent>

            {/* Tab Acciones */}
            <TabsContent value="acciones" className="space-y-4">
              <div className="space-y-3">
                {isActive && (
                  <Button
                    onClick={() => setIsDischargeModalOpen(true)}
                    className="w-full bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                    size="lg"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Dar de Alta
                  </Button>
                )}
                <p className="text-sm text-gray-500 text-center">
                  {isActive
                    ? "El alta generará el pago total basado en los días de estancia"
                    : "Esta hospitalización ya fue dada de alta"}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DischargeModal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        hospitalization={hospitalization}
        onDischarge={async () => {
          setIsDischargeModalOpen(false);
          onUpdate();
        }}
      />
    </>
  );
}

