"use client";

import React, { forwardRef } from 'react';
import { MedicalDocumentWithRelations } from '@/types/medical-documents';
import { FileText, Activity, Clipboard } from 'lucide-react';

interface PrintableDocumentContentProps {
  document: MedicalDocumentWithRelations;
}

const PrintableDocumentContent = forwardRef<HTMLDivElement, PrintableDocumentContentProps>(
  ({ document }, ref) => {
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

    const getDocumentTitle = () => {
      switch (document.documentType) {
        case 'constancia':
          return 'CONSTANCIA MÉDICA';
        case 'incapacidad':
          return 'CERTIFICADO DE INCAPACIDAD';
        case 'orden_examen':
          return 'ORDEN DE EXAMEN';
        default:
          return 'DOCUMENTO MÉDICO';
      }
    };

    const getDocumentIcon = () => {
      switch (document.documentType) {
        case 'constancia':
          return <FileText className="h-16 w-16" />;
        case 'incapacidad':
          return <Activity className="h-16 w-16" />;
        case 'orden_examen':
          return <Clipboard className="h-16 w-16" />;
      }
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
          {/* Header con degradado */}
          <div className="print-header bg-gradient-to-r from-[#2E9589] to-[#247066] text-white p-8 print:p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">Hospital Zuniga, S. DE R. L.</h1>
                <p className="text-sm opacity-90">Dirección del hospital</p>
                <p className="text-sm opacity-90">Teléfono: (504) 0000-0000</p>
                <p className="text-sm opacity-90">RTN: 00000000000000</p>
              </div>
              <div className="text-white opacity-80">
                {getDocumentIcon()}
              </div>
            </div>
          </div>

          {/* Título del Documento */}
          <div className="text-center py-8 border-b-4 border-[#2E9589] print-color-box">
            <h2 className="text-3xl font-bold text-gray-900 print:text-4xl">{getDocumentTitle()}</h2>
            <p className="text-sm text-gray-500 mt-2">Documento No. {document.id.substring(0, 10).toUpperCase()}</p>
          </div>

          {/* Contenido */}
          <div className="p-8 space-y-8 print:p-6">
            {/* Información del Paciente */}
            <div className="print-color-box bg-gray-50 border-l-4 border-[#2E9589] p-6 rounded-r-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Datos del Paciente</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Nombre Completo:</p>
                  <p className="text-gray-900 font-semibold text-base">
                    {document.patient.firstName} {document.patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Identidad:</p>
                  <p className="text-gray-900 font-semibold">{document.patient.identityNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Edad:</p>
                  <p className="text-gray-900 font-semibold">{calculateAge(document.patient.birthDate)} años</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Sexo:</p>
                  <p className="text-gray-900 font-semibold">{document.patient.gender}</p>
                </div>
              </div>
            </div>

            {/* Contenido según tipo */}
            {document.documentType === 'constancia' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Constancia
                </h3>
                <div className="text-gray-900 leading-relaxed whitespace-pre-wrap text-justify text-base" style={{ minHeight: '200px' }}>
                  {document.constancia}
                </div>
              </div>
            )}

            {document.documentType === 'incapacidad' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-wide">
                    Diagnóstico
                  </h3>
                  <div className="print-color-box bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                      {document.diagnostico}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-wide">
                    Reposo Médico
                  </h3>
                  <div className="print-color-box bg-blue-50 border-2 border-blue-400 p-6 rounded-lg">
                    <p className="text-gray-900 text-xl font-bold mb-4 text-center">
                      Se otorga reposo médico por {document.diasReposo} día{document.diasReposo !== 1 ? 's' : ''}
                    </p>
                    {document.fechaInicio && document.fechaFin && (
                      <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t border-blue-200">
                        <div className="text-center">
                          <p className="text-gray-600 font-medium text-sm mb-1">Fecha de Inicio:</p>
                          <p className="text-gray-900 font-bold text-lg">{formatDate(document.fechaInicio)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-600 font-medium text-sm mb-1">Fecha de Retorno:</p>
                          <p className="text-gray-900 font-bold text-lg">{formatDate(document.fechaFin)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {document.documentType === 'orden_examen' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-wide">
                    Tipo de Examen Solicitado
                  </h3>
                  <div className="print-color-box bg-purple-50 border-l-4 border-purple-500 p-5 rounded-r-lg">
                    <p className="text-gray-900 font-bold text-xl">{document.tipoExamen}</p>
                  </div>
                </div>

                {document.urgencia === 'urgente' && (
                  <div className="print-color-box bg-red-100 border-4 border-red-600 p-5 rounded-lg">
                    <p className="text-red-900 font-bold text-center text-2xl tracking-wide">
                      ⚠️ EXAMEN URGENTE ⚠️
                    </p>
                    <p className="text-red-800 text-center text-sm mt-2">
                      Requiere atención prioritaria
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 mb-4 uppercase tracking-wide">
                    Indicaciones Clínicas
                  </h3>
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-300">
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                      {document.indicaciones}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer con firma */}
          <div className="p-8 border-t-2 border-gray-200 bg-gray-50 print:mt-12">
            <div className="flex justify-between items-start">
              <div className="text-sm text-gray-600">
                <p className="font-semibold text-gray-700 mb-1">Fecha de emisión:</p>
                <p className="text-gray-900 font-bold text-base">{formatDate(document.createdAt)}</p>
              </div>
              <div className="text-center">
                <div className="mb-16 print:mb-20">
                  <p className="text-xs text-gray-500 mb-1 italic">Espacio para firma y sello</p>
                </div>
                <div className="w-72 border-t-2 border-gray-900 pt-2">
                  <p className="text-gray-900 font-bold text-lg">Dr(a). {document.issuer.name}</p>
                  <p className="text-gray-600 text-sm font-medium mt-1">Médico Tratante</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de página */}
          <div className="print-footer bg-gradient-to-r from-[#2E9589] to-[#247066] text-white text-center py-4 print:py-3">
            <p className="text-sm opacity-90 font-medium">
              Este documento es de carácter oficial y debe ser validado con firma y sello del médico
            </p>
          </div>
        </div>
      </div>
    );
  }
);

PrintableDocumentContent.displayName = 'PrintableDocumentContent';

export default PrintableDocumentContent;

