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
import { Printer, X, Scan } from 'lucide-react';
import { RadiologyOrderWithRelations } from '@/types/radiology';
import PrintableRadiologyReport from './PrintableRadiologyReport';

interface PrintRadiologyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: RadiologyOrderWithRelations | null;
}

export default function PrintRadiologyReportModal({
  isOpen,
  onClose,
  order,
}: PrintRadiologyReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: order ? `Informe_RayosX_${order.patient.firstName}_${order.patient.lastName}_${order.id.substring(0, 10)}` : 'Informe_RayosX',
  });

  if (!order) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
          {/* Header */}
          <DialogHeader className="border-b-4 border-[#2E9589] pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#2E9589]/10 rounded-lg">
                  <Scan className="h-5 w-5 text-[#2E9589]" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    Informe de Rayos X
                  </DialogTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Vista previa del informe
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Información del informe */}
          <div className="space-y-4 py-6">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Paciente:</span> {order.patient.firstName} {order.patient.lastName}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Orden No.:</span> {order.id.substring(0, 10).toUpperCase()}
              </p>
              {order.completedAt && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fecha de Realización:</span> {new Date(order.completedAt).toLocaleString('es-HN')}
                </p>
              )}
            </div>

            {!order.notes && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ El informe está incompleto. Por favor agregue notas adicionales antes de imprimir.
                </p>
              </div>
            )}
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
              disabled={!order.notes}
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
        <PrintableRadiologyReport ref={printRef} order={order} />
      </div>
    </>
  );
}

