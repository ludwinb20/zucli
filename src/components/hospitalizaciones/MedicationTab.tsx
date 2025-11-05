import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill, Plus, Clock } from "lucide-react";
import { HospitalizationWithRelations } from "@/types/hospitalization";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MedicationTabProps {
  hospitalization: HospitalizationWithRelations;
  isActive: boolean;
  onRegisterMedication: () => void;
}

export default function MedicationTab({
  hospitalization,
  isActive,
  onRegisterMedication,
}: MedicationTabProps) {
  // Flatten los controles de medicamentos en una lista de items individuales
  const medicationItems = hospitalization.medicationControls?.flatMap((control) =>
    control.items.map((item) => ({
      id: item.id,
      medicationName: item.serviceItem.name,
      variant: item.variant?.name,
      quantity: item.quantity,
      time: new Date(control.createdAt),
      controlId: control.id,
    }))
  ) || [];

  // Ordenar por fecha/hora descendente (más reciente primero)
  medicationItems.sort((a, b) => b.time.getTime() - a.time.getTime());

  const formatTimeOnly = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full">
      {medicationItems.length > 0 ? (
        <>
          {isActive && (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={onRegisterMedication}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Medicamento
              </Button>
            </div>
          )}
          
          <Card className="bg-white border-gray-200">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Hora</TableHead>
                    <TableHead>Medicamento Administrado</TableHead>
                    <TableHead className="w-[100px] text-right">Cantidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicationItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900">
                              {formatTimeOnly(item.time)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(item.time).toLocaleDateString("es-HN", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4 text-[#2E9589]" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.medicationName}
                            </p>
                            {item.variant && (
                              <p className="text-xs text-gray-500">
                                {item.variant}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No hay medicamentos registrados</p>
          {isActive && (
            <Button
              onClick={onRegisterMedication}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primer Medicamento
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

