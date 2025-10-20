import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Stethoscope, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { HospitalizationWithRelations } from "@/types/hospitalization";

interface ExamenFisicoTabProps {
  hospitalization: HospitalizationWithRelations;
  isActive: boolean;
  onRegisterExamenFisico: () => void;
}

export default function ExamenFisicoTab({
  hospitalization,
  isActive,
  onRegisterExamenFisico,
}: ExamenFisicoTabProps) {
  const [expandedExamen, setExpandedExamen] = useState<string | null>(null);

  return (
    <>
      {hospitalization.examenFisicos && hospitalization.examenFisicos.length > 0 ? (
        <>
          {isActive && (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={onRegisterExamenFisico}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Examen Físico
              </Button>
            </div>
          )}
          <div className="space-y-3">
            {hospitalization.examenFisicos.map((examen, index) => {
              const isExpanded = expandedExamen === examen.id;

              return (
                <div key={examen.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Header del Acordeón */}
                  <button
                    onClick={() => setExpandedExamen(isExpanded ? null : examen.id)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Stethoscope className="h-4 w-4 text-green-600" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">
                          Examen Físico #{hospitalization.examenFisicos!.length - index}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(examen.createdAt).toLocaleString("es-HN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {/* Contenido del Acordeón */}
                  {isExpanded && (
                    <div className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {examen.aparienciaGeneral && (
                          <div>
                            <p className="text-gray-500 mb-1">Apariencia General</p>
                            <p className="font-medium text-gray-900">{examen.aparienciaGeneral}</p>
                          </div>
                        )}
                        {examen.cabeza && (
                          <div>
                            <p className="text-gray-500 mb-1">Cabeza</p>
                            <p className="font-medium text-gray-900">{examen.cabeza}</p>
                          </div>
                        )}
                        {examen.ojos && (
                          <div>
                            <p className="text-gray-500 mb-1">Ojos</p>
                            <p className="font-medium text-gray-900">{examen.ojos}</p>
                          </div>
                        )}
                        {examen.orl && (
                          <div>
                            <p className="text-gray-500 mb-1">ORL</p>
                            <p className="font-medium text-gray-900">{examen.orl}</p>
                          </div>
                        )}
                        {examen.torax && (
                          <div>
                            <p className="text-gray-500 mb-1">Tórax</p>
                            <p className="font-medium text-gray-900">{examen.torax}</p>
                          </div>
                        )}
                        {examen.corazon && (
                          <div>
                            <p className="text-gray-500 mb-1">Corazón</p>
                            <p className="font-medium text-gray-900">{examen.corazon}</p>
                          </div>
                        )}
                        {examen.pulmones && (
                          <div>
                            <p className="text-gray-500 mb-1">Pulmones</p>
                            <p className="font-medium text-gray-900">{examen.pulmones}</p>
                          </div>
                        )}
                        {examen.abdomen && (
                          <div>
                            <p className="text-gray-500 mb-1">Abdomen</p>
                            <p className="font-medium text-gray-900">{examen.abdomen}</p>
                          </div>
                        )}
                        {examen.genitoUrinario && (
                          <div>
                            <p className="text-gray-500 mb-1">Genito-Urinario</p>
                            <p className="font-medium text-gray-900">{examen.genitoUrinario}</p>
                          </div>
                        )}
                        {examen.extremidades && (
                          <div>
                            <p className="text-gray-500 mb-1">Extremidades</p>
                            <p className="font-medium text-gray-900">{examen.extremidades}</p>
                          </div>
                        )}
                        {examen.osteoarticular && (
                          <div>
                            <p className="text-gray-500 mb-1">Osteoarticular</p>
                            <p className="font-medium text-gray-900">{examen.osteoarticular}</p>
                          </div>
                        )}
                        {examen.pielYPaneras && (
                          <div>
                            <p className="text-gray-500 mb-1">Piel y Paneras</p>
                            <p className="font-medium text-gray-900">{examen.pielYPaneras}</p>
                          </div>
                        )}
                        {examen.neurologicos && (
                          <div>
                            <p className="text-gray-500 mb-1">Neurológicos</p>
                            <p className="font-medium text-gray-900">{examen.neurologicos}</p>
                          </div>
                        )}
                        {examen.columna && (
                          <div>
                            <p className="text-gray-500 mb-1">Columna</p>
                            <p className="font-medium text-gray-900">{examen.columna}</p>
                          </div>
                        )}
                        {examen.comentarios && (
                          <div className="col-span-1 md:col-span-2">
                            <p className="text-gray-500 mb-1">Comentarios</p>
                            <p className="font-medium text-gray-900">{examen.comentarios}</p>
                          </div>
                        )}
                        {examen.diagnostico && (
                          <div className="col-span-1 md:col-span-2">
                            <p className="text-gray-500 mb-1">Diagnóstico</p>
                            <p className="font-medium text-gray-900">{examen.diagnostico}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No hay exámenes físicos registrados</p>
          {isActive && (
            <Button
              onClick={onRegisterExamenFisico}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primer Examen Físico
            </Button>
          )}
        </div>
      )}
    </>
  );
}
