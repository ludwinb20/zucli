"use client";

import React, { useState } from "react";
import { DayPicker, getDefaultClassNames as getDefaultDayPickerClassNames } from "react-day-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { getDayName } from "./WeekDaySelector";
import "react-day-picker/dist/style.css";

interface SpecialtyDatePickerProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  availableDays: number[]; // Días disponibles [0-6]
  disabled?: boolean;
  minDate?: Date;
}

export function SpecialtyDatePicker({
  selectedDate,
  onDateSelect,
  availableDays,
  disabled = false,
  minDate = new Date(),
}: SpecialtyDatePickerProps) {
  const [open, setOpen] = useState(false);

  // Convertir días disponibles a días deshabilitados
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const disabledDaysOfWeek = availableDays.length > 0 && availableDays.length < 7
    ? allDays.filter(day => !availableDays.includes(day))
    : [];

  const footer = availableDays.length > 0 && availableDays.length < 7 ? (
    <p className="text-xs text-gray-600 px-3 py-2 border-t border-gray-200 bg-gray-50">
      <span className="font-semibold">Días disponibles:</span>{" "}
      {availableDays.map(d => getDayName(d)).join(", ")}
    </p>
  ) : null;

  const defaultClassNames = getDefaultDayPickerClassNames();

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={`w-full justify-start text-left font-normal ${
            !selectedDate && "text-muted-foreground"
          }`}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP", { locale: es })
          ) : (
            <span>Seleccionar fecha</span>
          )}
        </Button>
      </PopoverPrimitive.Trigger>
      
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content 
          className="w-auto p-0 bg-white border border-gray-200 rounded-lg shadow-xl z-[10001]" 
          align="center"
          side="right"
          sideOffset={4}
          avoidCollisions={true}
          collisionBoundary={document.body}
          style={{ zIndex: 10001 }}
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onDateSelect(date);
              setOpen(false);
            }}
            disabled={[
              { before: minDate },
              ...(disabledDaysOfWeek.length > 0 
                ? [{ dayOfWeek: disabledDaysOfWeek }] 
                : [])
            ]}
            locale={es}
            classNames={{
              root: `${defaultClassNames.root} shadow-lg p-5`,
              footer: "p-0",
            }}
            footer={footer}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
