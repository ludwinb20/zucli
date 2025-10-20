"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Printer, FileDown, Search, Calendar, FileText } from "lucide-react";
import { AuxiliaryBookData, getDefaultDateRange } from "@/types/reports";
import DateRangePicker from "./DateRangePicker";
import { Spinner } from "@/components/ui/spinner";
import { PrintTemplate } from "./PrintTemplate";

interface HospitalInfo {
  nombreComercial: string;
  razonSocial: string;
  rtn: string;
}

export default function AuxiliaryBookReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<AuxiliaryBookData | null>(null);
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const defaultRange = getDefaultDateRange();
  const [filters, setFilters] = useState({
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate
  });

  useEffect(() => {
    loadHospitalInfo();
  }, []);

  const loadHospitalInfo = async () => {
    try {
      const res = await fetch("/api/hospital-info");
      if (res.ok) {
        const data = await res.json();
        setHospitalInfo(data);
      }
    } catch (error) {
      console.error("Error loading hospital info:", error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      const response = await fetch(`/api/reports/auxiliary-book?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Error al generar reporte");
      }

      const data = await response.json();
      setReportData(data);

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Libro-Auxiliar-${filters.startDate}-${filters.endDate}`,
  });

  const formatCurrency = (amount: number) => {
    return `L. ${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="mb-6 bg-white border-gray-200 print:hidden">
        <CardContent className="pt-6 space-y-4">
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(date) => setFilters({ ...filters, startDate: date })}
            onEndDateChange={(date) => setFilters({ ...filters, endDate: date })}
          />

          <div className="flex gap-3">
            <Button
              onClick={handleGenerateReport}
              disabled={loading}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Generar Reporte
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {reportData && (
        <>
          {/* Botones de Acción */}
          <div className="flex gap-3 print:hidden">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>

          {/* Header para impresión */}
          <div className="hidden print:block mb-6">
            <h1 className="text-2xl font-bold text-center mb-2">Libro Auxiliar</h1>
            <p className="text-center text-gray-600">
              Período: {new Date(filters.startDate).toLocaleDateString('es-HN')} - {new Date(filters.endDate).toLocaleDateString('es-HN')}
            </p>
            <p className="text-center text-gray-500 text-sm">
              Generado: {new Date().toLocaleDateString('es-HN')} {new Date().toLocaleTimeString('es-HN')}
            </p>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Facturas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.totalInvoices}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <FileDown className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.totalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Totales Diarios */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#2E9589]" />
                Totales por Día
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left p-3 font-semibold text-gray-700">Fecha</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Cantidad Facturas</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Total del Día</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dailyTotals.map((day) => (
                      <tr 
                        key={day.date} 
                        className={cn(
                          "border-b border-gray-200",
                          day.invoiceCount > 0 ? "hover:bg-gray-50" : "bg-gray-50/50 text-gray-400"
                        )}
                      >
                        <td className="p-3">
                          {new Date(day.date).toLocaleDateString('es-HN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="p-3 text-center font-medium">
                          {day.invoiceCount}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {day.invoiceCount > 0 ? formatCurrency(day.total) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">
                        TOTAL GENERAL:
                      </td>
                      <td className="p-3 text-center font-bold text-gray-900">
                        {reportData.totalInvoices}
                      </td>
                      <td className="p-3 text-right font-bold text-[#2E9589] text-lg">
                        {formatCurrency(reportData.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!reportData && !loading && (
        <Card className="bg-white border-gray-200">
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Selecciona el rango de fechas y genera el reporte</p>
          </CardContent>
        </Card>
      )}

      {/* Contenido para Imprimir (Oculto) */}
      {reportData && hospitalInfo && (
        <div style={{ display: 'none' }}>
          <PrintTemplate
            ref={printRef}
            title="LIBRO AUXILIAR"
            startDate={filters.startDate}
            endDate={filters.endDate}
            hospitalInfo={hospitalInfo}
          >
            {/* Resumen */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Total Facturas Legales</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalInvoices}</p>
              </div>
              <div className="border border-gray-300 p-4 rounded">
                <p className="text-sm text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-[#2E9589]">
                  {formatCurrency(reportData.totalAmount)}
                </p>
              </div>
            </div>

            {/* Tabla de Totales Diarios */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Registro Diario de Facturación</h3>
              <table className="w-full text-sm border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="text-left p-3 font-semibold">Fecha</th>
                    <th className="text-center p-3 font-semibold">Cantidad Facturas</th>
                    <th className="text-right p-3 font-semibold">Total del Día</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.dailyTotals.map((day) => (
                    <tr 
                      key={day.date} 
                      className={day.invoiceCount > 0 ? "border-b border-gray-200" : "border-b border-gray-200 text-gray-400"}
                    >
                      <td className="p-3">
                        {new Date(day.date).toLocaleDateString('es-HN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="p-3 text-center font-medium">
                        {day.invoiceCount}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {day.invoiceCount > 0 ? formatCurrency(day.total) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td className="p-3 font-bold text-gray-900">TOTAL GENERAL:</td>
                    <td className="p-3 text-center font-bold text-gray-900">{reportData.totalInvoices}</td>
                    <td className="p-3 text-right font-bold text-[#2E9589] text-base">
                      {formatCurrency(reportData.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </PrintTemplate>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

