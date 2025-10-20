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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Printer, X, FileText, Activity, Clipboard } from 'lucide-react';
import { MedicalDocumentWithRelations, getDocumentTypeName } from '@/types/medical-documents';
import PrintableDocumentContent from './PrintableDocumentContent';

interface PrintDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: MedicalDocumentWithRelations | null;
}

export default function PrintDocumentModal({
  isOpen,
  onClose,
  document,
}: PrintDocumentModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: document ? `Documento_${document.documentType}_${document.patient.firstName}_${document.patient.lastName}` : 'Documento',
  });

  if (!document) return null;

  const getDocumentIcon = () => {
    switch (document.documentType) {
      case 'constancia':
        return <FileText className="h-5 w-5" />;
      case 'incapacidad':
        return <Activity className="h-5 w-5" />;
      case 'orden_examen':
        return <Clipboard className="h-5 w-5" />;
    }
  };

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
                  {getDocumentIcon()}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold text-gray-900">
                    {getDocumentTypeName(document.documentType)}
                  </DialogTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Vista previa del documento
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-[#2E9589]/10 text-[#2E9589] border-[#2E9589]/30">
                {document.id.substring(0, 10).toUpperCase()}
              </Badge>
            </div>
          </DialogHeader>

          {/* Vista previa simplificada */}
          <div className="space-y-6 py-6">
            {/* Constancia */}
            {document.documentType === 'constancia' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Contenido de la Constancia</Label>
                <Textarea
                  value={document.constancia || ''}
                  readOnly
                  rows={12}
                  className="resize-none bg-gray-50 border-gray-300"
                />
              </div>
            )}

            {/* Incapacidad */}
            {document.documentType === 'incapacidad' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Diagnóstico</Label>
                  <Textarea
                    value={document.diagnostico || ''}
                    readOnly
                    rows={4}
                    className="resize-none bg-gray-50 border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Días de Reposo</Label>
                    <Input
                      value={`${document.diasReposo} día${document.diasReposo !== 1 ? 's' : ''}`}
                      readOnly
                      className="bg-gray-50 border-gray-300 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Fecha de Inicio</Label>
                    <Input
                      value={document.fechaInicio ? formatDate(document.fechaInicio) : ''}
                      readOnly
                      className="bg-gray-50 border-gray-300"
                    />
                  </div>
                </div>

                {document.fechaFin && (
                  <div className="p-4 bg-[#2E9589]/10 border-2 border-[#2E9589]/30 rounded-lg">
                    <p className="text-sm text-gray-900 font-medium">
                      <span className="text-gray-600">Fecha de retorno al trabajo:</span>{' '}
                      <span className="font-bold">{formatDate(document.fechaFin)}</span>
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Orden de Examen */}
            {document.documentType === 'orden_examen' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tipo de Examen</Label>
                  <Input
                    value={document.tipoExamen || ''}
                    readOnly
                    className="bg-gray-50 border-gray-300 font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Indicaciones Clínicas</Label>
                  <Textarea
                    value={document.indicaciones || ''}
                    readOnly
                    rows={6}
                    className="resize-none bg-gray-50 border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Urgencia</Label>
                  {document.urgencia === 'urgente' ? (
                    <div className="p-3 bg-red-50 border-2 border-red-500 rounded-lg">
                      <p className="text-red-900 font-bold text-center">
                        ⚠️ URGENTE - Requiere atención prioritaria
                      </p>
                    </div>
                  ) : (
                    <Input
                      value="Normal"
                      readOnly
                      className="bg-gray-50 border-gray-300"
                    />
                  )}
                </div>
              </>
            )}

            {/* Información adicional */}
            <div className="pt-4 border-t-2 border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 font-medium">Doctor Emisor:</p>
                  <p className="text-gray-900 font-semibold">Dr(a). {document.issuer.name}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-medium">Fecha de Emisión:</p>
                  <p className="text-gray-900 font-semibold">{formatDate(document.createdAt)}</p>
                </div>
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
        <PrintableDocumentContent ref={printRef} document={document} />
      </div>
    </>
  );
}

