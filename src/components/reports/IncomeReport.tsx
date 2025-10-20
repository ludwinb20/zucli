"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Printer, FileDown, Search, TrendingUp, Tag, Stethoscope } from "lucide-react";
import { IncomeReportData, getDefaultDateRange } from "@/types/reports";
import DateRangePicker from "./DateRangePicker";
import { Spinner } from "@/components/ui/spinner";
import { PrintTemplate } from "./PrintTemplate";

interface Tag {
  id: string;
  name: string;
}

interface Specialty {
  id: string;
  name: string;
}

interface HospitalInfo {
  nombreComercial: string;
  razonSocial: string;
  rtn: string;
}

export default function IncomeReport() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<IncomeReportData | null>(null);
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const defaultRange = getDefaultDateRange();
  const [filters, setFilters] = useState({
    startDate: defaultRange.startDate,
    endDate: defaultRange.endDate,
    tags: [] as string[],
    specialtyId: ""
  });

  const [tags, setTags] = useState<Tag[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  // Cargar tags y especialidades
  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadFiltersData = async () => {
    try {
      // Cargar información del hospital
      const hospitalRes = await fetch("/api/hospital-info");
      if (hospitalRes.ok) {
        const hospitalData = await hospitalRes.json();
        setHospitalInfo(hospitalData);
      }

      // Cargar tags
      const tagsRes = await fetch("/api/tags");
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(tagsData.tags || []);
      }

      // Cargar especialidades
      const specialtiesRes = await fetch("/api/specialties");
      if (specialtiesRes.ok) {
        const specialtiesData = await specialtiesRes.json();
        setSpecialties(specialtiesData.specialties || []);
      }
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      if (filters.tags.length > 0) {
        params.append('tags', filters.tags.join(','));
      }

      if (filters.specialtyId) {
        params.append('specialtyId', filters.specialtyId);
      }

      const response = await fetch(`/api/reports/income?${params.toString()}`);
      
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
    documentTitle: `Reporte-Ingresos-${filters.startDate}-${filters.endDate}`,
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

          <div className="grid grid-cols-2 gap-4">
            {/* Especialidad */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Especialidad</Label>
              <Select
                value={filters.specialtyId || "all"}
                onValueChange={(value) => setFilters({ ...filters, specialtyId: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las especialidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Categorías (Tags)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {filters.tags.length === 0 
                      ? "Todas las categorías" 
                      : `${filters.tags.length} categoría${filters.tags.length > 1 ? 's' : ''} seleccionada${filters.tags.length > 1 ? 's' : ''}`
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-h-80 overflow-y-auto bg-white" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <Label className="text-sm font-medium">Seleccionar Categorías</Label>
                      {filters.tags.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilters({ ...filters, tags: [] })}
                          className="h-6 text-xs"
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={filters.tags.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilters({ 
                                ...filters, 
                                tags: [...filters.tags, tag.id] 
                              });
                            } else {
                              setFilters({ 
                                ...filters, 
                                tags: filters.tags.filter(t => t !== tag.id) 
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={`tag-${tag.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {tag.name}
                        </label>
                      </div>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No hay tags disponibles</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

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

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Ingresos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.summary.totalAmount)}
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
                    <p className="text-sm text-gray-600">Total Facturas</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData.summary.totalInvoices}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Tag className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Promedio/Factura</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(reportData.summary.totalInvoices > 0 
                        ? reportData.summary.totalAmount / reportData.summary.totalInvoices 
                        : 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen por Tag */}
          {reportData.summary.byTag.length > 0 && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#2E9589]" />
                  Resumen por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.summary.byTag.map((item) => (
                    <div key={item.tagName} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700">{item.tagName}</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(item.total)}</p>
                        <p className="text-xs text-gray-500">{item.count} items</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumen por Especialidad */}
          {reportData.summary.bySpecialty.length > 0 && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-[#2E9589]" />
                  Resumen por Especialidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reportData.summary.bySpecialty.map((item) => (
                    <div key={item.specialtyName} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-700">{item.specialtyName}</span>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(item.total)}</p>
                        <p className="text-xs text-gray-500">{item.count} facturas</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detalle de Facturas */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Detalle de Facturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left p-3 font-semibold text-gray-700">Número</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Fecha</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Cliente</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Identidad</th>
                      <th className="text-right p-3 font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.details.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3">{invoice.numeroDocumento}</td>
                        <td className="p-3">
                          {new Date(invoice.fechaEmision).toLocaleDateString('es-HN')}
                        </td>
                        <td className="p-3">{invoice.clienteNombre}</td>
                        <td className="p-3">{invoice.clienteIdentidad}</td>
                        <td className="p-3 text-right font-semibold">
                          {formatCurrency(invoice.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-50">
                      <td colSpan={4} className="p-3 text-right font-bold text-gray-900">
                        TOTAL GENERAL:
                      </td>
                      <td className="p-3 text-right font-bold text-[#2E9589] text-lg">
                        {formatCurrency(reportData.summary.totalAmount)}
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
            <p className="text-gray-500">Selecciona los filtros y genera el reporte</p>
          </CardContent>
        </Card>
      )}

      {/* Contenido para Imprimir (Oculto) */}
      {reportData && hospitalInfo && (
        <div style={{ display: 'none' }}>
          <PrintTemplate
            ref={printRef}
            title="REPORTE DE INGRESOS"
            startDate={filters.startDate}
            endDate={filters.endDate}
            hospitalInfo={hospitalInfo}
          >
            {/* Resumen General */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen General</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="border border-gray-300 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Ingresos</p>
                  <p className="text-2xl font-bold text-[#2E9589]">
                    {formatCurrency(reportData.summary.totalAmount)}
                  </p>
                </div>
                <div className="border border-gray-300 p-4 rounded">
                  <p className="text-sm text-gray-600">Total Facturas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData.summary.totalInvoices}
                  </p>
                </div>
                <div className="border border-gray-300 p-4 rounded">
                  <p className="text-sm text-gray-600">Promedio/Factura</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(reportData.summary.totalInvoices > 0 
                      ? reportData.summary.totalAmount / reportData.summary.totalInvoices 
                      : 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen por Tag */}
            {reportData.summary.byTag.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen por Categoría</h3>
                <table className="w-full text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="text-left p-3 font-semibold">Categoría</th>
                      <th className="text-center p-3 font-semibold">Cantidad</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.summary.byTag.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="p-3">{item.tagName}</td>
                        <td className="p-3 text-center">{item.count}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Resumen por Especialidad */}
            {reportData.summary.bySpecialty.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen por Especialidad</h3>
                <table className="w-full text-sm border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="text-left p-3 font-semibold">Especialidad</th>
                      <th className="text-center p-3 font-semibold">Cantidad</th>
                      <th className="text-right p-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.summary.bySpecialty.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="p-3">{item.specialtyName}</td>
                        <td className="p-3 text-center">{item.count}</td>
                        <td className="p-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Detalle de Facturas */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Detalle de Facturas</h3>
              <table className="w-full text-sm border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="text-left p-2 font-semibold">Número</th>
                    <th className="text-left p-2 font-semibold">Fecha</th>
                    <th className="text-left p-2 font-semibold">Cliente</th>
                    <th className="text-left p-2 font-semibold">Identidad</th>
                    <th className="text-right p-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.details.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-200">
                      <td className="p-2 text-xs">{invoice.numeroDocumento}</td>
                      <td className="p-2">{new Date(invoice.fechaEmision).toLocaleDateString('es-HN')}</td>
                      <td className="p-2">{invoice.clienteNombre}</td>
                      <td className="p-2">{invoice.clienteIdentidad}</td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(invoice.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 border-t-2 border-gray-300">
                    <td colSpan={4} className="p-3 text-right font-bold text-gray-900">
                      TOTAL GENERAL:
                    </td>
                    <td className="p-3 text-right font-bold text-[#2E9589] text-base">
                      {formatCurrency(reportData.summary.totalAmount)}
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

