import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Bed,
  Activity,
  LogOut,
  Plus,
  ChevronDown,
  Droplet,
  Utensils,
  Toilet,
  Clock,
  Stethoscope,
  Pill,
  ClipboardList,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { HospitalizationWithRelations } from "@/types/hospitalization";
import PrintEpicrisisModal from "./PrintEpicrisisModal";
import { useState } from "react";
import { Printer } from "lucide-react";

interface TimelineTabProps {
  hospitalization: HospitalizationWithRelations;
  isActive: boolean;
  onRegisterVitals: () => void;
  onRegisterInsulin: () => void;
  onRegisterIntakeOutput: () => void;
  onRegisterExamenFisico: () => void;
  onRegisterMedication: () => void;
  onRegisterNursingNote: () => void;
  onViewAdmissionRecord: () => void;
  onDischarge: () => void;
}

export default function TimelineTab({
  hospitalization,
  isActive,
  onRegisterVitals,
  onRegisterInsulin,
  onRegisterIntakeOutput,
  onRegisterExamenFisico,
  onRegisterMedication,
  onRegisterNursingNote,
  onViewAdmissionRecord,
  onDischarge,
}: TimelineTabProps) {
  const [isPrintEpicrisisModalOpen, setIsPrintEpicrisisModalOpen] = useState(false);
  // Función para generar el contenido del dialog del examen físico
  const generateExamenFisicoDialogContent = (examenFisico: Record<string, unknown>) => {
    const fields = [
      { key: 'aparienciaGeneral', label: 'Apariencia General' },
      { key: 'cabeza', label: 'Cabeza' },
      { key: 'ojos', label: 'Ojos' },
      { key: 'orl', label: 'ORL' },
      { key: 'torax', label: 'Tórax' },
      { key: 'corazon', label: 'Corazón' },
      { key: 'pulmones', label: 'Pulmones' },
      { key: 'abdomen', label: 'Abdomen' },
      { key: 'genitoUrinario', label: 'Genito-urinario' },
      { key: 'extremidades', label: 'Extremidades' },
      { key: 'osteoarticular', label: 'Osteoarticular' },
      { key: 'pielYPaneras', label: 'Piel y Paneras' },
      { key: 'neurologicos', label: 'Neurológicos' },
      { key: 'columna', label: 'Columna' },
      { key: 'comentarios', label: 'Comentarios' },
      { key: 'diagnostico', label: 'Diagnóstico' }
    ];

    const filledFields = fields.filter(field => {
      const value = examenFisico[field.key];
      return typeof value === 'string' && value.trim();
    });
    
    if (filledFields.length === 0) {
      return <p className="text-sm text-gray-500">Sin información registrada</p>;
    }

    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <div className="text-xs text-gray-500">
          Registrado el {new Date(examenFisico.createdAt as string | Date).toLocaleDateString("es-HN", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} a las {new Date(examenFisico.createdAt as string | Date).toLocaleTimeString("es-HN", {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        {filledFields.map(field => (
          <div key={field.key} className="border-l-4 border-green-500 pl-3 py-2">
            <span className="font-semibold text-green-700 text-sm">{field.label}</span>
            <p className="text-gray-700 mt-1 text-sm leading-relaxed">{String(examenFisico[field.key])}</p>
          </div>
        ))}
      </div>
    );
  };
  // Crear array de eventos unificado
  type PreclinicaEvent = {
    id: string;
    type: 'preclinica';
    createdAt: string | Date;
    data: NonNullable<typeof hospitalization.preclinicas>[number];
  };
  
  type InsulinEvent = {
    id: string;
    type: 'insulin';
    createdAt: string | Date;
    data: NonNullable<typeof hospitalization.insulinControls>[number];
  };
  
  type IntakeOutputEvent = {
    id: string;
    type: 'intakeOutput';
    createdAt: string | Date;
    data: NonNullable<typeof hospitalization.intakeOutputControls>[number];
  };
  
  type ExamenFisicoEvent = {
    id: string;
    type: 'examenFisico';
    createdAt: string | Date;
    data: NonNullable<typeof hospitalization.examenFisicos>[number];
  };
  
  type MedicationEvent = {
    id: string;
    type: 'medication';
    createdAt: string | Date;
    data: NonNullable<typeof hospitalization.medicationControls>[number];
  };
  
  type NursingNoteEvent = {
    id: string;
    type: 'nursingNote';
    createdAt: string | Date;
    data: NonNullable<typeof hospitalization.nursingNotes>[number];
  };
  
  type TimelineEvent = PreclinicaEvent | InsulinEvent | IntakeOutputEvent | ExamenFisicoEvent | MedicationEvent | NursingNoteEvent;

  const events: TimelineEvent[] = [
    ...(hospitalization.preclinicas?.map(p => ({
      id: p.id,
      type: 'preclinica' as const,
      createdAt: p.createdAt,
      data: p,
    })) || []),
    ...(hospitalization.insulinControls?.map(c => ({
      id: c.id,
      type: 'insulin' as const,
      createdAt: c.createdAt,
      data: c,
    })) || []),
    ...(hospitalization.intakeOutputControls?.map(io => ({
      id: io.id,
      type: 'intakeOutput' as const,
      createdAt: io.createdAt,
      data: io,
    })) || []),
    ...(hospitalization.examenFisicos?.map(ef => ({
      id: ef.id,
      type: 'examenFisico' as const,
      createdAt: ef.createdAt,
      data: ef,
    })) || []),
    ...(hospitalization.medicationControls?.map(mc => ({
      id: mc.id,
      type: 'medication' as const,
      createdAt: mc.createdAt,
      data: mc,
    })) || []),
    ...(hospitalization.nursingNotes?.map(nn => ({
      id: nn.id,
      type: 'nursingNote' as const,
      createdAt: nn.createdAt,
      data: nn,
    })) || []),
  ].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="relative">
      <div className="flex justify-center">
        <div className="w-4/5">
          <Timeline position="alternate">
            {/* Ingreso */}
            <TimelineItem>
              <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                {new Date(hospitalization.admissionDate).toLocaleDateString("es-HN", {
                  weekday: 'long'
                })} {new Date(hospitalization.admissionDate).toLocaleTimeString("es-HN", {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineConnector />
                <TimelineDot sx={{ bgcolor: '#2E9589' }}>
                  <Bed className="h-4 w-4 text-white" />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <div className="bg-white border border-gray-200 hover:border-[#2E9589] rounded-lg px-3 py-2 shadow-sm transition-all cursor-pointer">
                  <div className="flex items-center justify-start gap-2">
                    <Bed className="h-4 w-4 text-[#2E9589]" />
                    <p className="text-sm font-semibold text-gray-900">Ingreso a Hospitalización</p>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <p><span className="font-medium">Médico de Sala:</span> {hospitalization.medicoSalaUser?.name || 'No asignado'}</p>
                    {hospitalization.room && (
                      <p><span className="font-medium">Habitación:</span> {hospitalization.room.number}</p>
                    )}
                    {hospitalization.diagnosis && (
                      <p><span className="font-medium">Diagnóstico:</span> {hospitalization.diagnosis}</p>
                    )}
                  </div>
                </div>
              </TimelineContent>
            </TimelineItem>

            {/* Registro de Admisión */}
            {hospitalization.admissionRecord && (
              <TimelineItem>
                <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                  {new Date(hospitalization.admissionRecord.createdAt).toLocaleDateString("es-HN", {
                    weekday: 'long'
                  })} {new Date(hospitalization.admissionRecord.createdAt).toLocaleTimeString("es-HN", {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot sx={{ bgcolor: '#2E9589' }}>
                    <FileText className="h-4 w-4 text-white" />
                  </TimelineDot>
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <div 
                    className="bg-white border border-gray-200 hover:border-[#2E9589] rounded-lg px-3 py-2 shadow-sm transition-all cursor-pointer"
                    onClick={onViewAdmissionRecord}
                  >
                    <div className="flex items-center gap-2 justify-start">
                      <FileText className="h-4 w-4 text-[#2E9589]" />
                      <p className="text-sm font-semibold text-gray-900">Registro de Admisión</p>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {hospitalization.admissionRecord.dieta && (
                        <p className="truncate"><span className="font-medium">Dieta:</span> {hospitalization.admissionRecord.dieta}</p>
                      )}
                      {hospitalization.admissionRecord.signosVitalesHoras && (
                        <p><span className="font-medium">Signos Vitales:</span> cada {hospitalization.admissionRecord.signosVitalesHoras} horas</p>
                      )}
                      {(hospitalization.admissionRecord.anotaciones?.length || 0) > 0 && (
                        <p><span className="font-medium">Anotaciones:</span> {hospitalization.admissionRecord.anotaciones?.length}</p>
                      )}
                      {(hospitalization.admissionRecord.ordenes?.length || 0) > 0 && (
                        <p><span className="font-medium">Órdenes:</span> {hospitalization.admissionRecord.ordenes?.length}</p>
                      )}
                    </div>
                  </div>
                </TimelineContent>
              </TimelineItem>
            )}

            {/* Eventos (Signos Vitales, Controles de Insulina e Ingestas/Excretas) */}
            {events.map((event, eventIndex) => {
              // Determinar si el elemento está a la izquierda (índice impar) o derecha (índice par)
              // El primer evento después del ingreso tiene índice 0, por lo que será derecha
              const isLeftSide = eventIndex % 2 === 1;
              if (event.type === 'preclinica') {
                const preclinica = event.data;
                const hasVitals = preclinica.presionArterial || preclinica.temperatura || 
                                 preclinica.fc || preclinica.fr || preclinica.satO2 || 
                                 preclinica.peso || preclinica.talla;
                
                return (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                      {new Date(preclinica.createdAt).toLocaleDateString("es-HN", {
                        weekday: 'long'
                      })} {new Date(preclinica.createdAt).toLocaleTimeString("es-HN", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineConnector />
                      <TimelineDot sx={{ bgcolor: '#3b82f6' }}>
                        <Activity className="h-4 w-4 text-white" />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <div className="bg-white border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-2 shadow-sm transition-all cursor-pointer">
                        {
                          isLeftSide ? (
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-semibold text-gray-900">Signos Vitales</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <Activity className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-semibold text-gray-900">Signos Vitales</p>
                            </div>
                          )
                        }
                        {hasVitals && (
                          <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-1">
                            {preclinica.presionArterial && (
                              <p><span className="font-medium">PA:</span> {preclinica.presionArterial}</p>
                            )}
                            {preclinica.temperatura && (
                              <p><span className="font-medium">Temp:</span> {preclinica.temperatura}°C</p>
                            )}
                            {preclinica.fc && (
                              <p><span className="font-medium">FC:</span> {preclinica.fc} lpm</p>
                            )}
                            {preclinica.fr && (
                              <p><span className="font-medium">FR:</span> {preclinica.fr} rpm</p>
                            )}
                            {preclinica.satO2 && (
                              <p><span className="font-medium">SatO₂:</span> {preclinica.satO2}%</p>
                            )}
                            {preclinica.peso && (
                              <p><span className="font-medium">Peso:</span> {preclinica.peso} lb</p>
                            )}
                            {preclinica.talla && (
                              <p><span className="font-medium">Talla:</span> {preclinica.talla} cm</p>
                            )}
                          </div>
                        )}
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                );
              } else if (event.type === 'insulin') {
                const control = event.data;
                
                return (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                      {new Date(control.createdAt).toLocaleDateString("es-HN", {
                        weekday: 'long'
                      })} {new Date(control.createdAt).toLocaleTimeString("es-HN", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineConnector />
                      <TimelineDot sx={{ bgcolor: '#9333ea' }}>
                        <Droplet className="h-4 w-4 text-white" />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <div className="bg-white border border-gray-200 hover:border-purple-300 rounded-lg px-3 py-2 shadow-sm transition-all cursor-pointer">
                        {
                          isLeftSide ? (
                            <div className="flex items-center gap-2">
                              <Droplet className="h-4 w-4 text-purple-600" />
                              <p className="text-sm font-semibold text-gray-900">Control de Insulina</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <Droplet className="h-4 w-4 text-purple-600" />
                              <p className="text-sm font-semibold text-gray-900">Control de Insulina</p>
                            </div>
                          )
                        }
                        <div className="mt-2 text-xs text-gray-600 grid grid-cols-2 gap-1">
                          <p><span className="font-medium">Glucosa:</span> {control.resultado} mg/dL</p>
                          <p><span className="font-medium">Insulina:</span> {control.insulinaAdministrada} unidades</p>
                        </div>
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                );
              } else if (event.type === 'intakeOutput') {
                const intakeOutput = event.data;
                
                return (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                      {new Date(intakeOutput.createdAt).toLocaleDateString("es-HN", {
                        weekday: 'long'
                      })} {new Date(intakeOutput.createdAt).toLocaleTimeString("es-HN", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineConnector />
                      <TimelineDot sx={{ bgcolor: '#f97316' }}>
                        {intakeOutput.type === 'ingesta' ? 
                          <Utensils className="h-4 w-4 text-white" /> : 
                          <Toilet className="h-4 w-4 text-white" />
                        }
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <div className="bg-white border border-gray-200 hover:border-orange-300 rounded-lg px-3 py-2 shadow-sm transition-all cursor-pointer">
                        {
                          isLeftSide ? (
                            <div className={`flex items-center gap-2 justify-start`}>
                            {intakeOutput.type === 'ingesta' ? 
                              <Utensils className="h-4 w-4 text-orange-600" /> : 
                              <Toilet className="h-4 w-4 text-orange-600" />
                            }
                            <p className="text-sm font-semibold text-gray-900">
                              {intakeOutput.type === 'ingesta' ? 'Ingesta' : 'Excreta'}
                            </p>
                          </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              {intakeOutput.type === 'ingesta' ? 
                                <Utensils className="h-4 w-4 text-orange-600" /> : 
                                <Toilet className="h-4 w-4 text-orange-600" />
                              }
                              <p className="text-sm font-semibold text-gray-900">
                                {intakeOutput.type === 'ingesta' ? 'Ingesta' : 'Excreta'}
                              </p>
                            </div>
                          )
                        }
                        <div className="mt-2 text-xs text-gray-600">
                          {intakeOutput.type === 'ingesta' ? (
                            <div className="grid grid-cols-2 gap-1">
                              <p><span className="font-medium">Tipo:</span> {intakeOutput.ingestaType}</p>
                              <p><span className="font-medium">Cantidad:</span> {intakeOutput.cantidad} ml</p>
                            </div>
                          ) : (
                            <div className="space-y-1 text-xs text-gray-700">
                              <p><span className="font-medium">Tipo:</span> {intakeOutput.excretaType === 'sng' ? 'S.N.G' : intakeOutput.excretaType}</p>
                              {(intakeOutput.excretaType === 'orina' || intakeOutput.excretaType === 'drenaje') && intakeOutput.excretaCantidad !== null && intakeOutput.excretaCantidad !== undefined && (
                                <p><span className="font-medium">Cantidad:</span> {intakeOutput.excretaCantidad} ml</p>
                              )}
                              {intakeOutput.excretaType === 'otros' && (
                                <p className="text-gray-500">Registrar detalles adicionales en notas de enfermería</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                );
              } else if (event.type === 'examenFisico') {
                const examenFisico = event.data;
                const hasContent = examenFisico.aparienciaGeneral || examenFisico.cabeza || 
                                 examenFisico.ojos || examenFisico.orl || examenFisico.torax || 
                                 examenFisico.corazon || examenFisico.pulmones || examenFisico.abdomen ||
                                 examenFisico.genitoUrinario || examenFisico.extremidades || 
                                 examenFisico.osteoarticular || examenFisico.pielYPaneras ||
                                 examenFisico.neurologicos || examenFisico.columna || 
                                 examenFisico.comentarios || examenFisico.diagnostico;
                
                return (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                      {new Date(examenFisico.createdAt).toLocaleDateString("es-HN", {
                        weekday: 'long'
                      })} {new Date(examenFisico.createdAt).toLocaleTimeString("es-HN", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineConnector />
                      <TimelineDot sx={{ bgcolor: '#10b981' }}>
                        <Stethoscope className="h-4 w-4 text-white" />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="bg-white border border-gray-200 hover:border-green-300 rounded-lg px-3 py-2 shadow-sm transition-all cursor-pointer">
                            {
                              isLeftSide ? (
                                <div className="flex items-center gap-2 justify-start">
                                  <Stethoscope className="h-4 w-4 text-green-600" />
                                  <p className="text-sm font-semibold text-gray-900">Examen Físico</p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 justify-end">
                                  <Stethoscope className="h-4 w-4 text-green-600" />
                                  <p className="text-sm font-semibold text-gray-900">Examen Físico</p>
                                </div>
                              )
                            }
                            {hasContent && (
                              <div className="mt-2 text-xs text-gray-600">
                                {(() => {
                                  // Priorizar diagnóstico y comentarios
                                  const priorityFields = [];
                                  
                                  if (examenFisico.diagnostico && examenFisico.diagnostico.trim()) {
                                    priorityFields.push({ label: 'Diagnóstico', value: examenFisico.diagnostico });
                                  }
                                  
                                  if (examenFisico.comentarios && examenFisico.comentarios.trim()) {
                                    priorityFields.push({ label: 'Comentarios', value: examenFisico.comentarios });
                                  }
                                  
                                  // Si no hay diagnóstico ni comentarios, buscar otros campos con contenido
                                  if (priorityFields.length === 0) {
                                    const otherFields = [
                                      { key: 'aparienciaGeneral', label: 'Apariencia General' },
                                      { key: 'cabeza', label: 'Cabeza' },
                                      { key: 'ojos', label: 'Ojos' },
                                      { key: 'orl', label: 'ORL' },
                                      { key: 'torax', label: 'Tórax' },
                                      { key: 'corazon', label: 'Corazón' },
                                      { key: 'pulmones', label: 'Pulmones' },
                                      { key: 'abdomen', label: 'Abdomen' },
                                      { key: 'genitoUrinario', label: 'Genito-urinario' },
                                      { key: 'extremidades', label: 'Extremidades' },
                                      { key: 'osteoarticular', label: 'Osteoarticular' },
                                      { key: 'pielYPaneras', label: 'Piel y Paneras' },
                                      { key: 'neurologicos', label: 'Neurológicos' },
                                      { key: 'columna', label: 'Columna' }
                                    ];
                                    
                                    // Buscar los primeros 2 campos con contenido
                                    for (const field of otherFields) {
                                      const value = (examenFisico as unknown as Record<string, unknown>)[field.key];
                                      if (typeof value === 'string' && value.trim()) {
                                        priorityFields.push({ label: field.label, value: value });
                                        if (priorityFields.length >= 2) break;
                                      }
                                    }
                                  }
                                  
                                  // Mostrar hasta 2 campos
                                  return priorityFields.slice(0, 2).map((field, index) => (
                                    <p key={index} className="truncate">
                                      <span className="font-medium">{field.label}:</span> {field.value}
                                    </p>
                                  ));
                                })()}
                              </div>
                            )}
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Stethoscope className="h-5 w-5 text-green-600" />
                              Examen Físico Completo
                            </DialogTitle>
                          </DialogHeader>
                          {generateExamenFisicoDialogContent(examenFisico as unknown as Record<string, unknown>)}
                        </DialogContent>
                      </Dialog>
                    </TimelineContent>
                  </TimelineItem>
                );
              } else if (event.type === 'medication') {
                const medication = event.data;
                const totalItems = medication.items?.length || 0;
                
                return (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                      {new Date(medication.createdAt).toLocaleDateString("es-HN", {
                        weekday: 'long'
                      })} {new Date(medication.createdAt).toLocaleTimeString("es-HN", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineConnector />
                      <TimelineDot sx={{ bgcolor: '#6366f1' }}>
                        <Pill className="h-4 w-4 text-white" />
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <div className="bg-white border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-2 shadow-sm transition-all">
                      {
                        isLeftSide ? (
                          <div className="flex items-center gap-2 justify-start">
                            <Pill className="h-4 w-4 text-indigo-600" />
                            <p className="text-sm font-semibold text-gray-900">
                              Control de Medicamentos
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <Pill className="h-4 w-4 text-indigo-600" />
                            <p className="text-sm font-semibold text-gray-900">
                              Control de Medicamentos
                            </p>
                          </div>
                        )
                      }
                        {totalItems > 0 && (
                          <div className="mt-2 space-y-1">
                            {medication.items?.map((item, idx) => (
                              <div key={item.id} className="text-xs text-gray-700 pl-2">
                                <span className="font-medium">{item.quantity}x</span> {item.serviceItem?.name ?? item.medicationName?.name ?? 'Medicamento'}
                                {item.variant && <span className="text-indigo-600"> ({item.variant.name})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                );
              } else if (event.type === 'nursingNote') {
                const nursingNote = event.data;
                const isLeftSide = eventIndex % 2 === 1;
                
                return (
                  <TimelineItem key={event.id}>
                    <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                      {new Date(nursingNote.createdAt).toLocaleDateString("es-HN", {
                        weekday: 'long'
                      })} {new Date(nursingNote.createdAt).toLocaleTimeString("es-HN", {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineConnector />
                      <TimelineDot sx={{ bgcolor: '#3b82f6' }}>
                        <ClipboardList className="h-4 w-4 text-white" />
                      </TimelineDot>
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <div className="bg-white border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-2 shadow-sm transition-all cursor-pointer">
                        {
                          isLeftSide ? (
                            <div className="flex items-center gap-2 justify-start">
                              <ClipboardList className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-semibold text-gray-900">Nota de Enfermería</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 justify-end">
                              <ClipboardList className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-semibold text-gray-900">Nota de Enfermería</p>
                            </div>
                          )
                        }
                        <div className="mt-2 text-xs text-gray-600">
                          <p className="truncate">{nursingNote.content}</p>
                        </div>
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                );
              }
            })}

            {/* Registro de Alta */}
            {hospitalization.dischargeRecord && (
              <TimelineItem>
                <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                  {new Date(hospitalization.dischargeRecord.createdAt).toLocaleDateString("es-HN", {
                    weekday: 'long'
                  })} {new Date(hospitalization.dischargeRecord.createdAt).toLocaleTimeString("es-HN", {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot sx={{ bgcolor: '#dc2626' }}>
                    <LogOut className="h-4 w-4 text-white" />
                  </TimelineDot>
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="bg-white border border-gray-200 hover:border-red-300 rounded-lg px-3 py-2 shadow-sm transition-all cursor-pointer">
                        <div className="flex items-center gap-2 justify-start">
                          <LogOut className="h-4 w-4 text-red-600" />
                          <p className="text-sm font-semibold text-gray-900">Alta Médica</p>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          <p><span className="font-medium">Días de Estancia:</span> {hospitalization.dischargeRecord.diasEstancia}</p>
                          <p><span className="font-medium">Costo Total:</span> L{Number(hospitalization.dischargeRecord.costoTotal).toFixed(2)}</p>
                          {hospitalization.dischargeRecord.condicionSalida && (
                            <p><span className="font-medium">Condición:</span> {hospitalization.dischargeRecord.condicionSalida}</p>
                          )}
                          {hospitalization.dischargeRecord.citaConsultaExterna && (
                            <p><span className="font-medium">Cita Agendada:</span> Sí</p>
                          )}
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <div className="flex items-center justify-between">
                          <DialogTitle className="flex items-center gap-2">
                            <LogOut className="h-5 w-5 text-red-600" />
                            Epicrisis
                          </DialogTitle>
                          <Button
                            onClick={() => setIsPrintEpicrisisModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10 mt-6"
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimir
                          </Button>
                        </div>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Información General */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900">Información General</h4>
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Fecha de Alta:</span> {new Date(hospitalization.dischargeRecord.createdAt).toLocaleDateString("es-HN")}</p>
                              <p><span className="font-medium">Hora de Alta:</span> {new Date(hospitalization.dischargeRecord.createdAt).toLocaleTimeString("es-HN", { hour: '2-digit', minute: '2-digit' })}</p>
                              <p><span className="font-medium">Días de Estancia:</span> {hospitalization.dischargeRecord.diasEstancia}</p>
                              <p><span className="font-medium">Costo Total:</span> L{Number(hospitalization.dischargeRecord.costoTotal).toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900">Condición de Salida</h4>
                            <div className="space-y-1 text-sm">
                              {hospitalization.dischargeRecord.condicionSalida ? (
                                <p><span className="font-medium">Estado:</span> {hospitalization.dischargeRecord.condicionSalida}</p>
                              ) : (
                                <p className="text-gray-500">No especificada</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Diagnósticos */}
                        {(hospitalization.dischargeRecord.diagnosticoIngreso || hospitalization.dischargeRecord.diagnosticoEgreso) && (
                          <div className="space-y-3">
                            <h4 className="font-semibold text-gray-900">Diagnósticos</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {hospitalization.dischargeRecord.diagnosticoIngreso && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">Diagnóstico de Ingreso</label>
                                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                    {hospitalization.dischargeRecord.diagnosticoIngreso}
                                  </div>
                                </div>
                              )}
                              
                              {hospitalization.dischargeRecord.diagnosticoEgreso && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-gray-700">Diagnóstico de Egreso</label>
                                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                    {hospitalization.dischargeRecord.diagnosticoEgreso}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Resumen Clínico */}
                        {hospitalization.dischargeRecord.resumenClinico && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Resumen Clínico</label>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm">
                              {hospitalization.dischargeRecord.resumenClinico}
                            </div>
                          </div>
                        )}

                        {/* Tratamiento */}
                        {hospitalization.dischargeRecord.tratamiento && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Tratamiento</label>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm">
                              {hospitalization.dischargeRecord.tratamiento}
                            </div>
                          </div>
                        )}

                        {/* Recomendaciones */}
                        {hospitalization.dischargeRecord.recomendaciones && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Recomendaciones</label>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm">
                              {hospitalization.dischargeRecord.recomendaciones}
                            </div>
                          </div>
                        )}

                        {/* Cita de Consulta Externa */}
                        {hospitalization.dischargeRecord.citaConsultaExterna && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Cita de Consulta Externa</label>
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Fecha:</span> {hospitalization.dischargeRecord.cita?.appointmentDate ? new Date(hospitalization.dischargeRecord.cita.appointmentDate).toLocaleDateString("es-HN") : "No especificada"}
                                </div>
                                <div>
                                  <span className="font-medium">Hora:</span> {hospitalization.dischargeRecord.cita?.appointmentDate ? new Date(hospitalization.dischargeRecord.cita.appointmentDate).toLocaleTimeString("es-HN", { hour: '2-digit', minute: '2-digit' }) : "No especificada"}
                                </div>
                                <div>
                                  <span className="font-medium">Especialidad:</span> {hospitalization.dischargeRecord.cita?.specialty?.name || "No especificada"}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {/* Modal de impresión de Epicrisis */}
                  {hospitalization.dischargeRecord && (
                    <PrintEpicrisisModal
                      isOpen={isPrintEpicrisisModalOpen}
                      onClose={() => setIsPrintEpicrisisModalOpen(false)}
                      dischargeRecord={hospitalization.dischargeRecord}
                      hospitalization={hospitalization}
                    />
                  )}
                </TimelineContent>
              </TimelineItem>
            )}

            {/* Estado Actual o Alta */}
            {!hospitalization.dischargeRecord && (
              <TimelineItem>
                <TimelineOppositeContent sx={{ m: 'auto 0' }} align="right" variant="body2" color="text.secondary">
                  {new Date().toLocaleDateString("es-HN", {
                    weekday: 'long'
                  })} {new Date().toLocaleTimeString("es-HN", {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot sx={{ bgcolor: '#10b981', animation: 'pulse 2s infinite' }}>
                    <Clock className="h-4 w-4 text-white" />
                  </TimelineDot>
                </TimelineSeparator>
                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <div className="bg-white border border-green-200 rounded-lg px-3 py-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 ${events.length % 2 === 1 ? 'justify-end' : 'justify-start'}`}>
                        <Clock className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-semibold text-gray-900">Actualmente</p>
                      </div>
                      {isActive && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/5"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Registrar
                              <ChevronDown className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-full">
                            <DropdownMenuItem onClick={onRegisterVitals}>
                              <Activity className="h-4 w-4 mr-2 text-blue-600" />
                              Registrar Signos Vitales
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onRegisterInsulin}>
                              <Droplet className="h-4 w-4 mr-2 text-purple-600" />
                              Registrar Control de Insulina
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onRegisterIntakeOutput}>
                              <Utensils className="h-4 w-4 mr-2 text-orange-600" />
                              Registrar Ingesta/Excreta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onRegisterExamenFisico}>
                              <Stethoscope className="h-4 w-4 mr-2 text-green-600" />
                              Registrar Examen Físico
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onRegisterMedication}>
                              <Pill className="h-4 w-4 mr-2 text-indigo-600" />
                              Registrar Medicamentos
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onRegisterNursingNote}>
                              <ClipboardList className="h-4 w-4 mr-2 text-blue-600" />
                              Registrar Nota de Enfermería
                            </DropdownMenuItem>
                            {!hospitalization.admissionRecord && (
                              <DropdownMenuItem onClick={onViewAdmissionRecord}>
                                <FileText className="h-4 w-4 mr-2 text-[#2E9589]" />
                                Registrar Admisión
                              </DropdownMenuItem>
                            )}
                            {!hospitalization.dischargeRecord && (
                              <DropdownMenuItem onClick={onDischarge}>
                                <LogOut className="h-4 w-4 mr-2 text-red-600" />
                                Dar de Alta
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </TimelineContent>
              </TimelineItem>
            )}
          </Timeline>
        </div>
      </div>
    </div>
  );
}

