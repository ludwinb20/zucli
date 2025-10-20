import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, LogOut, Calendar, User, Bed, Clock, Stethoscope, CheckCircle, FilePlus } from "lucide-react";
import { HospitalizationWithRelations } from "@/types/hospitalization";
import { formatDaysOfStay } from "@/lib/hospitalization-helpers";

interface HospitalizationHeaderProps {
  hospitalization: HospitalizationWithRelations;
  isActive: boolean;
  onDischarge: () => void;
  onEmitDocument?: () => void;
}

export default function HospitalizationHeader({
  hospitalization,
  isActive,
  onDischarge,
  onEmitDocument,
}: HospitalizationHeaderProps) {
  const getStatusBadge = () => {
    if (hospitalization.status === "iniciada") {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Activa</Badge>;
    } else if (hospitalization.status === "completada") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completada</Badge>;
    }
    return null;
  };

  return (
    <div className="bg-gradient-to-r from-[#2E9589] to-[#2E9589]/80 p-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <div className="bg-white p-3 rounded-full">
            <Activity className="h-8 w-8 text-[#2E9589]" />
          </div>
          <div className="text-white">
            <h1 className="text-2xl font-bold">
              {hospitalization.patient.firstName} {hospitalization.patient.lastName}
            </h1>
            <p className="text-white/80 mt-1">
              {hospitalization.patient.identityNumber} • {" "}
              {new Date().getFullYear() - new Date(hospitalization.patient.birthDate).getFullYear()} años • {" "}
              {hospitalization.patient.gender}
            </p>
            {hospitalization.diagnosis && (
              <p className="mt-2 font-medium text-white/90">
                {hospitalization.diagnosis}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {getStatusBadge()}
          {onEmitDocument && (
            <Button
              onClick={onEmitDocument}
              variant="outline"
              size="sm"
              className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <FilePlus className="h-4 w-4 mr-2" />
              Emitir Documento
            </Button>
          )}
          {isActive && (
            <Button
              onClick={onDischarge}
              variant="outline"
              size="sm"
              className="bg-white text-green-600 border-green-200 hover:bg-green-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Dar de Alta
            </Button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 text-white/80 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Fecha de Ingreso</span>
          </div>
          <p className="text-white font-semibold">
            {new Date(hospitalization.admissionDate).toLocaleDateString("es-HN")}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 text-white/80 mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Días de Estancia</span>
          </div>
          <p className="text-white font-semibold">
            {hospitalization.costCalculation ? formatDaysOfStay(hospitalization.costCalculation.daysOfStay) : "Calculando..."}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 text-white/80 mb-1">
            <Stethoscope className="h-4 w-4" />
            <span className="text-sm">Doctor Responsable</span>
          </div>
          <p className="text-white font-semibold">
            {hospitalization.salaDoctor.name}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 text-white/80 mb-1">
            <Bed className="h-4 w-4" />
            <span className="text-sm">Habitación</span>
          </div>
          <p className="text-white font-semibold">
            {hospitalization.room ? `Hab. ${hospitalization.room.number}` : "Sin asignar"}
          </p>
        </div>

        {hospitalization.dischargeRecord && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-2 text-white/80 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Fecha de Alta</span>
            </div>
            <p className="text-white font-semibold">
              {new Date(hospitalization.dischargeRecord.createdAt).toLocaleDateString("es-HN")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

