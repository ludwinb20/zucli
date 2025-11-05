"use client";

import React, { forwardRef } from 'react';
import { RadiologyOrderWithRelations } from '@/types/radiology';
import { Scan } from 'lucide-react';

interface PrintableRadiologyReportProps {
  order: RadiologyOrderWithRelations;
}

const PrintableRadiologyReport = forwardRef<HTMLDivElement, PrintableRadiologyReportProps>(
  ({ order }, ref) => {
    const calculateAge = (birthDate: Date | string): number => {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return age;
    };

    const formatDate = (date: Date | string): string => {
      const d = new Date(date);
      return d.toLocaleDateString('es-HN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    };

    const formatDateTime = (date: Date | string): string => {
      const d = new Date(date);
      return d.toLocaleString('es-HN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <div ref={ref} className="bg-white">
        {/* Estilos para impresión */}
        <style jsx global>{`
          @media print {
            body {
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            @page {
              size: letter;
              margin: 1.5cm;
            }
            
            .print-header {
              background: #2E9589 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .print-footer {
              background: #2E9589 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .print-color-box {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>

        <div className="max-w-4xl mx-auto">
          {/* Header combinado */}
          <div className="print-header bg-gradient-to-r from-[#2E9589] to-[#247066] text-white p-4 print:p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-lg font-bold mb-1">Hospital Zuniga, S. DE R. L.</h1>
                <p className="text-sm opacity-90">Dirección del hospital • Tel: (504) 0000-0000 • RTN: 00000000000000</p>
              </div>
              <div className="text-center ml-4">
                <h2 className="text-lg font-bold mb-1">INFORME DE RAYOS X</h2>
                <p className="text-sm opacity-90">Orden No. {order.id.substring(0, 10).toUpperCase()}</p>
                <p className="text-sm opacity-90 mt-1">
                  Fecha de Emisión: {order.completedAt ? formatDate(order.completedAt) : formatDate(new Date())}
                </p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-6 print:p-4">
            {/* Información del Paciente */}
            <div className="print-color-box bg-gray-50 border-l-4 border-[#2E9589] px-4 py-3 rounded-r">
              <div className="flex items-center gap-8 text-sm">
                <div>
                  <span className="text-gray-600 font-medium">Nombre: </span>
                  <span className="text-gray-900 font-semibold">
                    {order.patient.firstName} {order.patient.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Identidad: </span>
                  <span className="text-gray-900 font-semibold">{order.patient.identityNumber}</span>
                </div>
              </div>
            </div>

            {/* Estudios Solicitados */}
            {order.payment.sale?.transactionItems && order.payment.sale.transactionItems.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-gray-900 border-b-2 border-gray-300 pb-2 uppercase">
                  Estudios Solicitados
                </h3>
                <div className="print-color-box bg-blue-50 border-l-4 border-blue-500 px-4 py-3 rounded-r">
                  <ul className="space-y-2">
                    {order.payment.sale.transactionItems.map((item, index) => (
                      <li key={item.id} className="text-gray-900 font-semibold text-base">
                        {index + 1}. {item.nombre}
                        {item.quantity > 1 && ` (x${item.quantity})`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Notas Adicionales */}
            {order.notes && (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-gray-900 border-b-2 border-gray-300 pb-2 uppercase">
                  Notas Adicionales
                </h3>
                <div className="bg-gray-50 px-4 py-3 rounded border border-gray-300">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                    {order.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer con firma */}
          <div className="px-6 py-4 border-t-2 border-gray-200 bg-gray-50 print:mt-6">
            <div className="flex justify-between items-start">
              <div className="text-sm text-gray-600">
                <p className="font-medium">
                  Fecha de Realización: {order.completedAt ? formatDate(order.completedAt) : formatDate(order.createdAt)}
                </p>
              </div>
              <div className="text-center flex-1">
                <div className="mb-10 print:mb-12">
                  <p className="text-xs text-gray-500 mb-1 italic">Espacio para firma y sello</p>
                </div>
                <div className="w-72 mx-auto border-t-2 border-gray-900 pt-2">
                  <p className="text-gray-900 font-bold text-lg">Dr(a). Radiólogo</p>
                  <p className="text-gray-600 text-sm font-medium mt-1">Servicio de Radiología</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de página */}
          <div className="print-footer bg-gradient-to-r from-[#2E9589] to-[#247066] text-white text-center py-3 print:py-2">
            <p className="text-sm opacity-90 font-medium">
              Este informe es de carácter oficial y debe ser validado con firma y sello del radiólogo
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PrintableRadiologyReport.displayName = 'PrintableRadiologyReport';

export default PrintableRadiologyReport;

