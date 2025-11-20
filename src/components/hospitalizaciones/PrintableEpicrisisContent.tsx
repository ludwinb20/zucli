"use client";

import React from 'react';
import { DischargeRecord } from '@/types/hospitalization';
import { HospitalizationWithRelations } from '@/types/hospitalization';
import { LogOut } from 'lucide-react';

interface PrintableEpicrisisContentProps {
  dischargeRecord: DischargeRecord;
  hospitalization: HospitalizationWithRelations;
}

export default function PrintableEpicrisisContent({
  dischargeRecord,
  hospitalization,
}: PrintableEpicrisisContentProps) {
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
      return d.toLocaleDateString('es-HN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const patient = hospitalization.patient;
    const medicoSala = hospitalization.medicoSalaUser;

    return (
      <div className="bg-white print-wrapper">
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
              margin: 1.5cm 1.5cm 2cm 1.5cm;
            }
            
            .print-header {
              background: #2E9589 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              page-break-inside: avoid;
              page-break-after: avoid;
            }
            
            .print-footer {
              background: #2E9589 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              page-break-inside: avoid;
              page-break-before: avoid;
            }
            
            .print-color-box {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .print-wrapper {
              padding: 0 !important;
            }
            
            /* Padding del contenido principal */
            .print-wrapper > div > div > div:nth-child(3) {
              padding: 1.5rem 1.5cm !important;
            }
            
            /* Evitar saltos de página innecesarios */
            .print-wrapper > div > div > div {
              orphans: 3;
              widows: 3;
            }
            
            /* Evitar que las secciones pequeñas se dividan */
            .print-wrapper .space-y-4 > .space-y-4,
            .print-wrapper .space-y-6 > .space-y-4 {
              page-break-inside: avoid;
              margin-bottom: 1rem;
            }
            
            /* Permitir saltos solo cuando sea necesario en secciones grandes */
            .print-wrapper .space-y-6 > * {
              page-break-inside: avoid;
              page-break-after: auto;
              margin-bottom: 1.5rem !important;
            }
            
            /* Espaciado adicional cuando se inicia en nueva página */
            .print-wrapper .space-y-6 > *:first-child {
              margin-top: 0;
            }
            
            /* Asegurar espacio antes de una nueva página */
            .print-wrapper .space-y-6 > .space-y-4 {
              page-break-inside: avoid;
              min-height: 4rem;
            }
            
            /* Permitir saltos en grids solo si es necesario */
            .print-wrapper .grid {
              page-break-inside: avoid;
            }
            
            /* Evitar que los títulos queden solos al final de página */
            .print-wrapper h3 {
              page-break-after: avoid;
              margin-bottom: 0.75rem !important;
            }
            
            /* Asegurar espacio adecuado entre secciones */
            .print-wrapper .space-y-6 > .space-y-4:last-child {
              margin-bottom: 0;
            }
            
            /* Mejor espaciado para contenido que inicia en nueva página */
            .print-wrapper > div > div > div > div > div > * {
              padding-top: 0.5rem;
            }
          }
          .print-wrapper {
            padding: 1.5cm;
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
                <LogOut className="h-16 w-16" />
              </div>
            </div>
          </div>

          {/* Título del Documento */}
          <div className="text-center py-8 border-b-4 border-[#2E9589] print-color-box">
            <h2 className="text-3xl font-bold text-gray-900 print:text-4xl">EPICRISIS</h2>
            <p className="text-sm text-gray-500 mt-2">Documento No. {dischargeRecord.id.substring(0, 10).toUpperCase()}</p>
          </div>

          {/* Contenido */}
          <div className="p-8 space-y-6 print:p-6 print:space-y-6">
            {/* Información del Paciente */}
            <div className="print-color-box bg-gray-50 border-l-4 border-[#2E9589] p-6 rounded-r-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Datos del Paciente</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Nombre Completo:</p>
                  <p className="text-gray-900 font-semibold text-base">
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Identidad:</p>
                  <p className="text-gray-900 font-semibold">{patient.identityNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Edad:</p>
                  <p className="text-gray-900 font-semibold">{calculateAge(patient.birthDate)} años</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Sexo:</p>
                  <p className="text-gray-900 font-semibold">{patient.gender}</p>
                </div>
              </div>
            </div>

            {/* Información de Hospitalización */}
            <div className="print-color-box bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Información de Hospitalización</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Fecha de Ingreso:</p>
                  <p className="text-gray-900 font-semibold">{formatDateTime(hospitalization.admissionDate)}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Fecha de Alta:</p>
                  <p className="text-gray-900 font-semibold">{formatDateTime(dischargeRecord.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Días de Estancia:</p>
                  <p className="text-gray-900 font-semibold text-lg">{dischargeRecord.diasEstancia} día(s)</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Habitación:</p>
                  <p className="text-gray-900 font-semibold">{hospitalization.room ? `Hab. ${hospitalization.room.number}` : 'No asignada'}</p>
                </div>
                {medicoSala && (
                  <div>
                    <p className="text-gray-600 font-medium">Médico de Sala:</p>
                    <p className="text-gray-900 font-semibold">Dr(a). {medicoSala.name}</p>
                  </div>
                )}
                {dischargeRecord.condicionSalida && (
                  <div>
                    <p className="text-gray-600 font-medium">Condición de Salida:</p>
                    <p className="text-gray-900 font-semibold">{dischargeRecord.condicionSalida}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnósticos */}
            {(dischargeRecord.diagnosticoIngreso || dischargeRecord.diagnosticoEgreso) && (
              <div className="space-y-4 print:break-inside-avoid">
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Diagnósticos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dischargeRecord.diagnosticoIngreso && (
                    <div className="print-color-box bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Diagnóstico de Ingreso</h4>
                      <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                        {dischargeRecord.diagnosticoIngreso}
                      </p>
                    </div>
                  )}
                  
                  {dischargeRecord.diagnosticoEgreso && (
                    <div className="print-color-box bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Diagnóstico de Egreso</h4>
                      <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                        {dischargeRecord.diagnosticoEgreso}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resumen Clínico */}
            {dischargeRecord.resumenClinico && (
              <div className="space-y-4 print:break-inside-avoid">
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Resumen Clínico
                </h3>
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-300">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                    {dischargeRecord.resumenClinico}
                  </p>
                </div>
              </div>
            )}

            {/* Tratamiento */}
            {dischargeRecord.tratamiento && (
              <div className="space-y-4 print:break-inside-avoid">
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Tratamiento
                </h3>
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-300">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                    {dischargeRecord.tratamiento}
                  </p>
                </div>
              </div>
            )}

            {/* Recomendaciones */}
            {dischargeRecord.recomendaciones && (
              <div className="space-y-4 print:break-inside-avoid">
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Recomendaciones
                </h3>
                <div className="print-color-box bg-blue-50 border-l-4 border-blue-400 p-5 rounded-r-lg">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-base">
                    {dischargeRecord.recomendaciones}
                  </p>
                </div>
              </div>
            )}

            {/* Cita de Consulta Externa */}
            {dischargeRecord.citaConsultaExterna && dischargeRecord.cita && (
              <div className="space-y-4 print:break-inside-avoid">
                <h3 className="text-lg font-bold text-gray-900 border-b-2 border-gray-200 pb-2 uppercase tracking-wide">
                  Cita de Consulta Externa
                </h3>
                <div className="print-color-box bg-purple-50 border-2 border-purple-400 p-5 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium mb-1">Fecha:</p>
                      <p className="text-gray-900 font-semibold text-base">
                        {formatDate(dischargeRecord.cita.appointmentDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium mb-1">Hora:</p>
                      <p className="text-gray-900 font-semibold text-base">
                        {new Date(dischargeRecord.cita.appointmentDate).toLocaleTimeString('es-HN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium mb-1">Especialidad:</p>
                      <p className="text-gray-900 font-semibold text-base">
                        {dischargeRecord.cita.specialty?.name || 'No especificada'}
                      </p>
                    </div>
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
                <p className="text-gray-900 font-bold text-base">{formatDate(dischargeRecord.createdAt)}</p>
              </div>
              <div className="text-center">
                <div className="mb-16 print:mb-20">
                  <p className="text-xs text-gray-500 mb-1 italic">Espacio para firma y sello</p>
                </div>
                {medicoSala && (
                  <div className="w-72 border-t-2 border-gray-900 pt-2">
                    <p className="text-gray-900 font-bold text-lg">Dr(a). {medicoSala.name}</p>
                    <p className="text-gray-600 text-sm font-medium mt-1">Médico Tratante</p>
                  </div>
                )}
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

