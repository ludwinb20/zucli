"use client";

import { useState, useEffect } from "react";
import { AnesthesiaGridData } from "@/types/surgery";

interface AnesthesiaGridProps {
  data: AnesthesiaGridData;
  onChange: (data: AnesthesiaGridData) => void;
}

// Parámetros basados en el formulario médico
const PARAMETERS = [
  { key: "agenteLiquido", label: "Agente Líquido", type: "text" },
  { key: "propAnestesia", label: "Prop. de la anestesia", type: "text" },
  { key: "pava", label: "P.A.V.A.", type: "number", min: 20, max: 240 },
  { key: "pulso", label: "Pulso", type: "number", min: 20, max: 220 },
  { key: "comAnestesia", label: "Com. de la anest. X", type: "number", min: 20, max: 200 },
  { key: "comCirugia", label: "Com. de la cirugía", type: "number", min: 20, max: 140 },
  { key: "temperatura", label: "Temp.", type: "number", min: 20, max: 100 },
  { key: "aspiracion", label: "Aspiración S", type: "number", min: 20, max: 60 },
  { key: "recuperacion", label: "Paso al cuarto de recup R.", type: "number", min: 20, max: 40 },
  { key: "respiracion", label: "Resp. O", type: "text" },
  { key: "simbolos", label: "Símbolos Agente", type: "text" },
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

export default function AnesthesiaGrid({ data, onChange }: AnesthesiaGridProps) {
  const [gridData, setGridData] = useState<AnesthesiaGridData>(data);

  useEffect(() => {
    setGridData(data);
  }, [data]);

  const updateCell = (timeSlot: string, parameter: string, value: string) => {
    const newData = {
      ...gridData,
      [timeSlot]: {
        ...gridData[timeSlot],
        [parameter]: value || null,
      },
    };
    setGridData(newData);
    onChange(newData);
  };

  const getCellValue = (timeSlot: string, parameter: string): string => {
    const value = gridData[timeSlot]?.[parameter];
    return value != null ? String(value) : "";
  };

  const getParameterConfig = (parameterKey: string) => {
    return PARAMETERS.find(p => p.key === parameterKey) || { type: "text" };
  };

  return (
    <div className="w-full overflow-auto">
      <div className="min-w-[800px]">
        {/* Header con intervalos de tiempo */}
        <div className="flex">
          <div className="w-48 flex-shrink-0 bg-gray-100 border border-gray-300 p-2 font-semibold text-sm">
            Parámetros
          </div>
          {TIME_SLOTS.map((timeSlot) => (
            <div
              key={timeSlot}
              className="w-16 flex-shrink-0 bg-gray-100 border border-gray-300 p-1 text-xs font-semibold text-center"
            >
              {timeSlot}
            </div>
          ))}
        </div>

        {/* Filas de parámetros */}
        {PARAMETERS.map((parameter) => (
          <div key={parameter.key} className="flex">
            {/* Label del parámetro */}
            <div className="w-48 flex-shrink-0 bg-gray-50 border border-gray-300 p-2 text-xs font-medium">
              {parameter.label}
            </div>
            
            {/* Celdas de entrada */}
            {TIME_SLOTS.map((timeSlot) => {
              const config = getParameterConfig(parameter.key);
              return (
                <div
                  key={`${timeSlot}-${parameter.key}`}
                  className="w-16 flex-shrink-0 border border-gray-300"
                >
                  <input
                    type={config.type}
                    min={'min' in config ? config.min : undefined}
                    max={'max' in config ? config.max : undefined}
                    value={getCellValue(timeSlot, parameter.key)}
                    onChange={(e) => updateCell(timeSlot, parameter.key, e.target.value)}
                    className="w-full h-8 px-1 text-xs border-0 focus:ring-1 focus:ring-[#2E9589] focus:outline-none"
                    placeholder={config.type === "number" ? "0" : ""}
                  />
                </div>
              );
            })}
          </div>
        ))}

        {/* Leyenda de símbolos */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Símbolos Agente:</h4>
          <div className="grid grid-cols-7 gap-2 text-xs">
            <div><strong>A:</strong> Agente 1</div>
            <div><strong>B:</strong> Agente 2</div>
            <div><strong>C:</strong> Agente 3</div>
            <div><strong>D:</strong> Agente 4</div>
            <div><strong>E:</strong> Agente 5</div>
            <div><strong>F:</strong> Agente 6</div>
            <div><strong>G:</strong> Agente 7</div>
          </div>
        </div>
      </div>
    </div>
  );
}
