"use client";

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X, LogOut } from 'lucide-react';
import { DischargeRecord } from '@/types/hospitalization';
import { HospitalizationWithRelations } from '@/types/hospitalization';
import PrintableEpicrisisContent from './PrintableEpicrisisContent';

interface PrintEpicrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  dischargeRecord: DischargeRecord;
  hospitalization: HospitalizationWithRelations;
}

export default function PrintEpicrisisModal({
  isOpen,
  onClose,
  dischargeRecord,
  hospitalization,
}: PrintEpicrisisModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Epicrisis_${hospitalization.patient.firstName}_${hospitalization.patient.lastName}`,
  });

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          {/* Header */}
          <DialogHeader className="border-b-4 border-[#2E9589] pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2E9589]/10 rounded-lg">
                  <LogOut className="h-5 w-5 text-[#2E9589]" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Epicrisis
                  </DialogTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Vista previa del documento
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Información resumida */}
          <div className="space-y-4 py-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 font-medium">Paciente:</p>
                <p className="text-gray-900 font-semibold">
                  {hospitalization.patient.firstName} {hospitalization.patient.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Fecha de Alta:</p>
                <p className="text-gray-900 font-semibold">{formatDate(dischargeRecord.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Días de Estancia:</p>
                <p className="text-gray-900 font-semibold">{dischargeRecord.diasEstancia} día(s)</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Condición de Salida:</p>
                <p className="text-gray-900 font-semibold">{dischargeRecord.condicionSalida || 'No especificada'}</p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300"
            >
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
            <Button
              onClick={handlePrint}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white px-6"
              size="lg"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contenido oculto para impresión */}
      <div className="hidden">
        <div ref={printRef}>
          <PrintableEpicrisisContent 
            dischargeRecord={dischargeRecord} 
            hospitalization={hospitalization}
          />
        </div>
      </div>
    </>
  );
}

