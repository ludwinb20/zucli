import { Button } from "@/components/ui/button";
import { Utensils, Plus } from "lucide-react";
import { HospitalizationWithRelations } from "@/types/hospitalization";

interface IntakeOutputTabProps {
  hospitalization: HospitalizationWithRelations;
  isActive: boolean;
  onRegisterIntakeOutput: () => void;
}

export default function IntakeOutputTab({
  hospitalization,
  isActive,
  onRegisterIntakeOutput,
}: IntakeOutputTabProps) {
  return (
    <>
      {hospitalization.intakeOutputControls && hospitalization.intakeOutputControls.length > 0 ? (
        <>
          {isActive && (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={onRegisterIntakeOutput}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Registro
              </Button>
            </div>
          )}
          <div className="space-y-3">
            {hospitalization.intakeOutputControls.map((control, index) => (
              <div key={control.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Utensils className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {control.type === 'ingesta' ? 'Ingesta' : 'Excreta'} #{hospitalization.intakeOutputControls!.length - index}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(control.createdAt).toLocaleString("es-HN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                {control.type === 'ingesta' ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-gray-500 mb-1 text-xs">Tipo de Ingesta</p>
                      <p className="font-bold text-lg text-orange-700 capitalize">{control.ingestaType}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-gray-500 mb-1 text-xs">Cantidad</p>
                      <p className="font-bold text-lg text-blue-700">{control.cantidad} ml</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-gray-500 mb-1 text-xs">Tipo de Excreta</p>
                    <p className="font-bold text-lg text-red-700 capitalize">
                      {control.excretaType === 'sng' ? 'S.N.G' : control.excretaType}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No hay registros de ingestas o excretas</p>
          {isActive && (
            <Button
              onClick={onRegisterIntakeOutput}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primero
            </Button>
          )}
        </div>
      )}
    </>
  );
}

