"use client";

import React, { useState, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Activity, Clipboard, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InlineSpinner } from '@/components/ui/spinner';
import { DocumentType, Urgencia, MedicalDocumentModalProps, MedicalDocumentWithRelations } from '@/types/medical-documents';
import PrintDocumentModal from '@/components/medical-documents/PrintDocumentModal';

export default function MedicalDocumentModal({
  isOpen,
  onClose,
  patientId,
  onSuccess,
}: MedicalDocumentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('constancia');
  
  // Estados para constancia
  const [constancia, setConstancia] = useState('');
  
  // Estados para incapacidad
  const [diagnostico, setDiagnostico] = useState('');
  const [diasReposo, setDiasReposo] = useState(1);
  const [fechaInicio, setFechaInicio] = useState('');
  
  // Estados para orden de examen
  const [tipoExamen, setTipoExamen] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [urgencia, setUrgencia] = useState<Urgencia>('normal');

  // Estado para el modal de impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [createdDocument, setCreatedDocument] = useState<MedicalDocumentWithRelations | null>(null);

  // Resetear formulario al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      setDocumentType('constancia');
      setConstancia('');
      setDiagnostico('');
      setDiasReposo(1);
      setFechaInicio('');
      setTipoExamen('');
      setIndicaciones('');
      setUrgencia('normal');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const requestData: {
        patientId: string;
        documentType: string;
        constancia?: string;
        diagnostico?: string;
        diasReposo?: number;
        fechaInicio?: string;
        tipoExamen?: string;
        indicaciones?: string;
        urgencia?: string;
      } = {
        patientId,
        documentType,
      };

      // Validar y agregar datos según el tipo
      if (documentType === 'constancia') {
        if (!constancia.trim()) {
          toast({
            title: 'Error',
            description: 'El contenido de la constancia es requerido',
            variant: 'error',
          });
          return;
        }
        requestData.constancia = constancia.trim();
      } else if (documentType === 'incapacidad') {
        if (!diagnostico.trim()) {
          toast({
            title: 'Error',
            description: 'El diagnóstico es requerido',
            variant: 'error',
          });
          return;
        }
        if (!fechaInicio) {
          toast({
            title: 'Error',
            description: 'La fecha de inicio es requerida',
            variant: 'error',
          });
          return;
        }
        requestData.diagnostico = diagnostico.trim();
        requestData.diasReposo = diasReposo;
        requestData.fechaInicio = fechaInicio;
      } else if (documentType === 'orden_examen') {
        if (!tipoExamen.trim()) {
          toast({
            title: 'Error',
            description: 'El tipo de examen es requerido',
            variant: 'error',
          });
          return;
        }
        if (!indicaciones.trim()) {
          toast({
            title: 'Error',
            description: 'Las indicaciones clínicas son requeridas',
            variant: 'error',
          });
          return;
        }
        requestData.tipoExamen = tipoExamen.trim();
        requestData.indicaciones = indicaciones.trim();
        requestData.urgencia = urgencia;
      }

      // Crear el documento en la API
      const response = await fetch('/api/medical-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear documento');
      }

      const data = await response.json();

      // Guardar el documento y mostrar modal de impresión
      setCreatedDocument(data.document);
      setShowPrintModal(true);

      toast({
        title: 'Documento generado',
        description: 'El documento se ha creado y está listo para imprimir',
        variant: 'success',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al generar documento',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Emitir Documento Médico</DialogTitle>
        </DialogHeader>

        <div className="border-t border-gray-200 pt-6">
          <Tabs value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1">
              <TabsTrigger 
                value="constancia" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#2E9589] data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Constancia
              </TabsTrigger>
              <TabsTrigger 
                value="incapacidad" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#2E9589] data-[state=active]:shadow-sm"
              >
                <Activity className="h-4 w-4" />
                Incapacidad
              </TabsTrigger>
              <TabsTrigger 
                value="orden_examen" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#2E9589] data-[state=active]:shadow-sm"
              >
                <Clipboard className="h-4 w-4" />
                Orden de Examen
              </TabsTrigger>
            </TabsList>

          {/* Formulario Constancia */}
          <TabsContent value="constancia" className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="constancia" className="text-sm font-medium text-gray-700">
                Contenido de la Constancia *
              </Label>
              <Textarea
                id="constancia"
                value={constancia}
                onChange={(e) => setConstancia(e.target.value)}
                placeholder="Escriba el contenido de la constancia médica..."
                rows={12}
                className="mt-2 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] resize-none"
              />
              <p className="text-xs text-gray-500">
                Ejemplo: &quot;A quien corresponda, el/la paciente... se encuentra bajo tratamiento médico...&quot;
              </p>
            </div>
          </TabsContent>

          {/* Formulario Incapacidad */}
          <TabsContent value="incapacidad" className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="diagnostico" className="text-sm font-medium text-gray-700">
                Diagnóstico *
              </Label>
              <Textarea
                id="diagnostico"
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Diagnóstico médico..."
                rows={5}
                className="mt-2 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="diasReposo" className="text-sm font-medium text-gray-700">
                  Días de Reposo *
                </Label>
                <Input
                  id="diasReposo"
                  type="number"
                  min={1}
                  max={365}
                  value={diasReposo}
                  onChange={(e) => setDiasReposo(parseInt(e.target.value) || 1)}
                  className="mt-2 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaInicio" className="text-sm font-medium text-gray-700">
                  Fecha de Inicio *
                </Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="mt-2 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>
            </div>

            {fechaInicio && diasReposo > 0 && (
              <div className="p-4 bg-[#2E9589]/10 border-2 border-[#2E9589]/30 rounded-lg">
                <p className="text-sm text-gray-900 font-medium">
                  <span className="text-gray-600">Fecha de retorno al trabajo:</span>{' '}
                  {new Date(new Date(fechaInicio).getTime() + diasReposo * 24 * 60 * 60 * 1000).toLocaleDateString('es-HN', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Formulario Orden de Examen */}
          <TabsContent value="orden_examen" className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="tipoExamen" className="text-sm font-medium text-gray-700">
                Tipo de Examen *
              </Label>
              <Input
                id="tipoExamen"
                value={tipoExamen}
                onChange={(e) => setTipoExamen(e.target.value)}
                placeholder="Ej: Radiografía de Tórax, Hemograma Completo, etc."
                className="mt-2 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicaciones" className="text-sm font-medium text-gray-700">
                Indicaciones Clínicas *
              </Label>
              <Textarea
                id="indicaciones"
                value={indicaciones}
                onChange={(e) => setIndicaciones(e.target.value)}
                placeholder="Motivo del examen, síntomas, información relevante..."
                rows={6}
                className="mt-2 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589] resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Urgencia *</Label>
              <RadioGroup value={urgencia} onValueChange={(value) => setUrgencia(value as Urgencia)} className="flex gap-4">
                <div className="flex items-center space-x-2 p-3 border-2 border-gray-300 rounded-lg hover:border-[#2E9589]/50 has-[:checked]:border-[#2E9589] has-[:checked]:bg-[#2E9589]/5 transition-colors">
                  <RadioGroupItem value="normal" id="normal" />
                  <Label htmlFor="normal" className="font-normal cursor-pointer text-gray-700">
                    Normal
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border-2 border-gray-300 rounded-lg hover:border-red-500/50 has-[:checked]:border-red-500 has-[:checked]:bg-red-50 transition-colors">
                  <RadioGroupItem value="urgente" id="urgente" />
                  <Label htmlFor="urgente" className="font-normal cursor-pointer text-gray-700">
                    Urgente
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white px-6"
            size="lg"
          >
            {loading ? (
              <>
                <InlineSpinner size="sm" className="mr-2" />
                Generando...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Generar e Imprimir
              </>
            )}
          </Button>
        </div>
        </div>
      </DialogContent>
    </Dialog>
    
    {/* Modal de impresión */}
    <PrintDocumentModal
      isOpen={showPrintModal}
      onClose={() => {
        setShowPrintModal(false);
        setCreatedDocument(null);
      }}
      document={createdDocument}
    />
  </>
  );
}

