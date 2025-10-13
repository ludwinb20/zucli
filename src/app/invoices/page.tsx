"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  User,
  Calendar,
  Building2,
  Printer,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateSimpleReceiptFromDB, generateLegalInvoiceFromDB, printThermalReceipt } from "@/lib/thermal-printer";

// Tipo unificado para mostrar en la lista
type InvoiceListItem = {
  id: string;
  type: 'legal' | 'simple';
  numero: string;
  fecha: Date | string;
  clienteNombre: string;
  clienteRTN?: string;
  total: number;
  detalleGenerico: boolean;
  patientName: string;
  patientIdentity: string;
  raw?: Record<string, unknown>; // Datos completos para reimpresión
};

export default function InvoicesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Verificar permisos
  useEffect(() => {
    if (!authLoading && user) {
      const allowedRoles = ["caja", "admin"];
      if (!allowedRoles.includes(user.role.name)) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      
      // Construir parámetros de búsqueda
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
        type: typeFilter,
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/invoices?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      } else {
        throw new Error("Error al cargar facturas");
      }

    } catch (error) {
      console.error("Error loading invoices:", error);
      toast({
        title: "Error",
        description: "Error al cargar las facturas",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, typeFilter, searchTerm, toast]);

  // Cargar facturas
  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleReprint = async (invoice: InvoiceListItem) => {
    try {
      if (!invoice.raw) {
        throw new Error("No se encontraron los datos completos de la factura");
      }

      let receiptContent: string;

      if (invoice.type === 'legal') {
        // Reimprimir Factura Legal desde BD
        receiptContent = generateLegalInvoiceFromDB(invoice.raw as never);
      } else {
        // Reimprimir Recibo Simple desde BD
        receiptContent = generateSimpleReceiptFromDB(invoice.raw as never);
      }

      // Imprimir
      printThermalReceipt(receiptContent);

      toast({
        title: "Reimprimiendo",
        description: `${invoice.type === 'legal' ? 'Factura' : 'Recibo'} ${invoice.numero}`,
        variant: "success",
      });

    } catch (error) {
      console.error("Error reimprimiendo:", error);
      toast({
        title: "Error",
        description: "Error al reimprimir la factura",
        variant: "error",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `L ${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeBadge = (type: 'legal' | 'simple') => {
    if (type === 'legal') {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
          Factura Legal
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs">
        Recibo Simple
      </Badge>
    );
  };

  if (authLoading) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Facturas Emitidas
            </h2>
            <p className="text-gray-600">
              Consulta y reimprimir facturas y recibos
            </p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <Card className="bg-transparent border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Lista de Facturas
            </CardTitle>
            <div className="flex items-center space-x-4">
              {/* Filtro por Tipo */}
              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="w-48 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="legal">Facturas Legales</SelectItem>
                  <SelectItem value="simple">Recibos Simples</SelectItem>
                </SelectContent>
              </Select>

              {/* Barra de búsqueda */}
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por cliente o número..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-80 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>

              {/* Botón de recargar */}
              <Button
                onClick={loadInvoices}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E9589]"></div>
                <p className="text-gray-600 text-sm">Cargando facturas...</p>
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No se encontraron facturas</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || typeFilter !== "all"
                  ? "Intenta con otros términos de búsqueda o filtros"
                  : "No hay facturas emitidas en el sistema"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Icono */}
                      <div className="w-14 h-14 bg-[#2E9589] text-white rounded-full flex items-center justify-center flex-shrink-0">
                        <FileText className="h-7 w-7" />
                      </div>

                      {/* Información de la factura */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {invoice.clienteNombre}
                          </h3>
                          {getTypeBadge(invoice.type)}
                          {/* Total destacado */}
                          <div className="ml-auto">
                            <p className="text-3xl font-bold text-[#2E9589]">
                              {formatCurrency(invoice.total)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>{invoice.numero}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(invoice.fecha)}</span>
                          </div>
                          {invoice.clienteRTN && (
                            <div className="flex items-center space-x-1">
                              <Building2 className="h-4 w-4" />
                              <span>RTN: {invoice.clienteRTN}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>Paciente: {invoice.patientName}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acción */}
                    <div className="ml-4 flex-shrink-0">
                      <Button
                        onClick={() => handleReprint(invoice)}
                        variant="outline"
                        size="sm"
                        className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Reimprimir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Mostrando página {currentPage} de {totalPages} ({totalCount} {totalCount === 1 ? "factura" : "facturas"} en total)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="text-sm font-medium text-gray-700 px-4">
                      {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="border-gray-300"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

