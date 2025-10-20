"use client";

import { AnesthesiaGridData } from "@/types/surgery";

interface AnesthesiaGridPreviewProps {
  gridData: string | null;
}

// Parámetros basados en el formulario médico
const PARAMETERS = [
  { key: "agenteLiquido", label: "Agente Líquido" },
  { key: "propAnestesia", label: "Prop. de la anestesia" },
  { key: "pava", label: "P.A.V.A." },
  { key: "pulso", label: "Pulso" },
  { key: "comAnestesia", label: "Com. de la anest. X" },
  { key: "comCirugia", label: "Com. de la cirugía" },
  { key: "temperatura", label: "Temp." },
  { key: "aspiracion", label: "Aspiración S" },
  { key: "recuperacion", label: "Paso al cuarto de recup R." },
  { key: "respiracion", label: "Resp. O" },
  { key: "simbolos", label: "Símbolos Agente" },
];

// Intervalos de tiempo (15 minutos)
const TIME_SLOTS = [
  "00:00", "00:15", "00:30", "00:45",
  "01:00", "01:15", "01:30", "01:45",
  "02:00", "02:15", "02:30", "02:45",
  "03:00", "03:15", "03:30", "03:45",
  "04:00", "04:15", "04:30", "04:45",
  "05:00", "05:15", "05:30", "05:45",
  "06:00", "06:15", "06:30", "06:45",
];

export default function AnesthesiaGridPreview({ gridData }: AnesthesiaGridPreviewProps) {
  if (!gridData) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No hay datos de monitoreo registrados
      </div>
    );
  }

  let parsedData: AnesthesiaGridData = {};
  try {
    parsedData = JSON.parse(gridData);
  } catch (error) {
    console.error("Error parsing grid data:", error);
    return (
      <div className="text-sm text-red-500 text-center py-4">
        Error al cargar los datos del gráfico
      </div>
    );
  }

  const getCellValue = (timeSlot: string, parameter: string): string => {
    const value = parsedData[timeSlot]?.[parameter];
    return value?.toString() || "";
  };

  // Verificar si hay datos registrados
  const hasData = Object.keys(parsedData).length > 0;

  if (!hasData) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No hay datos de monitoreo registrados
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto bg-white rounded-lg border border-gray-300">
      <div className="min-w-[800px]">
        {/* Header con intervalos de tiempo */}
        <div className="flex sticky top-0 z-10">
          <div className="w-48 flex-shrink-0 bg-[#2E9589] text-white border border-gray-400 p-2 font-semibold text-xs">
            Parámetros
          </div>
          {TIME_SLOTS.map((timeSlot) => {
            // Solo mostrar columnas que tengan al menos un valor
            const hasValue = PARAMETERS.some(param => getCellValue(timeSlot, param.key));
            if (!hasValue) return null;
            
            return (
              <div
                key={timeSlot}
                className="w-16 flex-shrink-0 bg-[#2E9589] text-white border border-gray-400 p-1 text-xs font-semibold text-center"
              >
                {timeSlot}
              </div>
            );
          })}
        </div>

        {/* Filas de parámetros */}
        {PARAMETERS.map((parameter) => {
          // Solo mostrar filas que tengan al menos un valor
          const hasValue = TIME_SLOTS.some(timeSlot => getCellValue(timeSlot, parameter.key));
          if (!hasValue) return null;

          return (
            <div key={parameter.key} className="flex">
              {/* Label del parámetro */}
              <div className="w-48 flex-shrink-0 bg-gray-100 border border-gray-300 p-2 text-xs font-medium">
                {parameter.label}
              </div>
              
              {/* Celdas con valores */}
              {TIME_SLOTS.map((timeSlot) => {
                const hasTimeValue = PARAMETERS.some(param => getCellValue(timeSlot, param.key));
                if (!hasTimeValue) return null;

                const value = getCellValue(timeSlot, parameter.key);
                
                return (
                  <div
                    key={`${timeSlot}-${parameter.key}`}
                    className="w-16 flex-shrink-0 border border-gray-300 p-1 text-xs text-center bg-white"
                  >
                    {value && (
                      <span className="font-medium text-gray-800">{value}</span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Nota informativa */}
      <div className="p-3 bg-blue-50 border-t border-blue-200 text-xs text-blue-700 text-center">
        💡 Haz clic en &quot;Editar&quot; para ver el gráfico completo y realizar cambios
      </div>
    </div>
  );
}

