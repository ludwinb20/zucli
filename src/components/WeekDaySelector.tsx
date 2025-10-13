"use client";

import React from "react";
import { Label } from "@/components/ui/label";

interface WeekDaySelectorProps {
  selectedDays: number[]; // Array de números 0-6
  onChange: (days: number[]) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "Lunes", shortLabel: "L" },
  { value: 2, label: "Martes", shortLabel: "M" },
  { value: 3, label: "Miércoles", shortLabel: "X" },
  { value: 4, label: "Jueves", shortLabel: "J" },
  { value: 5, label: "Viernes", shortLabel: "V" },
  { value: 6, label: "Sábado", shortLabel: "S" },
  { value: 0, label: "Domingo", shortLabel: "D" },
];

export function WeekDaySelector({ selectedDays, onChange, disabled = false }: WeekDaySelectorProps) {
  const toggleDay = (day: number) => {
    if (disabled) return;
    
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day].sort((a, b) => {
        // Ordenar: Lunes(1) primero, Domingo(0) al final
        if (a === 0) return 1;
        if (b === 0) return -1;
        return a - b;
      }));
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Días de Atención</Label>
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.value} className="flex flex-col items-center">
            <div
              className={`
                w-12 h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all
                ${selectedDays.includes(day.value)
                  ? 'bg-[#2E9589] border-[#2E9589] text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-[#2E9589]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => toggleDay(day.value)}
            >
              <span className="text-sm font-semibold">{day.shortLabel}</span>
            </div>
            <span className="text-xs mt-1 text-gray-600">{day.label.slice(0, 3)}</span>
          </div>
        ))}
      </div>
      {selectedDays.length === 0 && (
        <p className="text-sm text-red-500">⚠️ Debe seleccionar al menos un día</p>
      )}
      {selectedDays.length > 0 && (
        <p className="text-sm text-gray-600">
          Días seleccionados: {selectedDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(", ")}
        </p>
      )}
    </div>
  );
}

// Helper function para obtener nombre del día
export function getDayName(dayOfWeek: number): string {
  const day = DAYS_OF_WEEK.find(d => d.value === dayOfWeek);
  return day?.label || "Desconocido";
}

// Helper function para obtener días disponibles de una fecha
export function isDateAvailable(date: Date, availableDays: number[]): boolean {
  const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  return availableDays.includes(dayOfWeek);
}

