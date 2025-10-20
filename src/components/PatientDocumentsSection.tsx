"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Activity,
  Clipboard,
  Printer,
  Search,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MedicalDocumentWithRelations, DocumentType, getDocumentTypeName, getDocumentTypeColor } from '@/types/medical-documents';
import { InlineSpinner } from '@/components/ui/spinner';
import PrintDocumentModal from '@/components/medical-documents/PrintDocumentModal';

interface PatientDocumentsSectionProps {
  patientId: string;
  showHeader?: boolean;
}

export default function PatientDocumentsSection({ patientId, showHeader = true }: PatientDocumentsSectionProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<MedicalDocumentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<MedicalDocumentWithRelations | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [patientId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/medical-documents?patientId=${patientId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar documentos');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los documentos médicos',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReprint = (doc: MedicalDocumentWithRelations) => {
    setSelectedDocument(doc);
    setShowPrintModal(true);
  };

  const getDocumentIcon = (type: DocumentType) => {
    switch (type) {
      case 'constancia':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'incapacidad':
        return <Activity className="h-5 w-5 text-orange-600" />;
      case 'orden_examen':
        return <Clipboard className="h-5 w-5 text-purple-600" />;
    }
  };

  const getDocumentSummary = (doc: MedicalDocumentWithRelations): string => {
    if (doc.documentType === 'constancia') {
      return doc.constancia?.substring(0, 100) + (doc.constancia && doc.constancia.length > 100 ? '...' : '') || '';
    } else if (doc.documentType === 'incapacidad') {
      return `${doc.diagnostico} - ${doc.diasReposo} días de reposo`;
    } else if (doc.documentType === 'orden_examen') {
      return `${doc.tipoExamen} - ${doc.urgencia === 'urgente' ? 'URGENTE' : 'Normal'}`;
    }
    return '';
  };

  // Filtrar documentos
  const filteredDocuments = documents.filter((doc) => {
    const matchesType = filterType === 'all' || doc.documentType === filterType;
    const matchesSearch = 
      searchTerm === '' ||
      getDocumentSummary(doc).toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.issuer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  if (loading) {
    if (showHeader) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos Médicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <InlineSpinner size="md" />
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <div className="flex items-center justify-center py-8">
          <InlineSpinner size="md" />
        </div>
      );
    }
  }

  const content = (
    <>
      {showHeader && (
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-6 w-6 text-[#2E9589]" />
          <h3 className="text-xl font-bold text-gray-900">Documentos Médicos</h3>
          <Badge variant="outline" className="ml-2 bg-[#2E9589]/10 text-[#2E9589] border-[#2E9589]/30">
            {documents.length}
          </Badge>
        </div>
      )}
      
      <div>
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar en documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-56 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]">
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="constancia">Constancias</SelectItem>
              <SelectItem value="incapacidad">Incapacidades</SelectItem>
              <SelectItem value="orden_examen">Órdenes de Examen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de documentos */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            {searchTerm || filterType !== 'all' ? (
              <>
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No se encontraron documentos</p>
                <p className="text-gray-400 text-sm mt-1">Intenta con otros filtros de búsqueda</p>
              </>
            ) : (
              <>
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No hay documentos médicos emitidos</p>
                <p className="text-gray-400 text-sm mt-1">Los documentos aparecerán aquí cuando sean generados</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-[#2E9589]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-3 bg-[#2E9589]/10 rounded-lg border border-[#2E9589]/20">
                      {getDocumentIcon(doc.documentType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getDocumentTypeColor(doc.documentType)} font-medium`}>
                          {getDocumentTypeName(doc.documentType)}
                        </Badge>
                        {doc.documentType === 'orden_examen' && doc.urgencia === 'urgente' && (
                          <Badge className="bg-red-100 text-red-800 font-semibold border border-red-300">
                            ⚠️ URGENTE
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 font-medium mb-2 leading-relaxed">
                        {getDocumentSummary(doc)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-[#2E9589]" />
                          <span className="font-medium">Dr(a). {doc.issuer.name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          {new Date(doc.createdAt).toLocaleDateString('es-HN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReprint(doc)}
                    className="flex-shrink-0 border-gray-300 hover:bg-[#2E9589] hover:text-white hover:border-[#2E9589] transition-colors"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  if (showHeader) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="bg-gradient-to-r from-[#2E9589] to-[#2E9589]/80 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <FileText className="h-5 w-5" />
              Documentos Médicos
              <Badge variant="outline" className="ml-2 bg-white/20 text-white border-white/30">
                {documents.length}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {content}
      
      {/* Modal de impresión */}
      <PrintDocumentModal
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
      />
    </>
  );
}

