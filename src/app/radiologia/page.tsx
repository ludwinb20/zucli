"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
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
  Activity,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  User,
  Calendar,
  FileText,
  Printer,
} from "lucide-react";
import { RadiologyOrderWithRelations } from "@/types/radiology";
import { useToast } from "@/hooks/use-toast";
import RadiologyResultsModal from "@/components/RadiologyResultsModal";
import PrintRadiologyReportModal from "@/components/radiology/PrintRadiologyReportModal";

export default function RadiologyPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [orders, setOrders] = useState<RadiologyOrderWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<RadiologyOrderWithRelations | null>(null);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<RadiologyOrderWithRelations | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const allowedRoles = ["radiologo", "admin"];
      if (!allowedRoles.includes(user.role.name)) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/radiology?${params}`);
      if (!response.ok) throw new Error('Error al cargar órdenes');

      const data = await response.json();
      setOrders(data.orders);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes de radiología",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm, toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleOpenResults = (order: RadiologyOrderWithRelations) => {
    setSelectedOrder(order);
    setIsResultsModalOpen(true);
  };

  const handlePrintOrder = (order: RadiologyOrderWithRelations) => {
    setOrderToPrint(order);
    setIsPrintModalOpen(true);
  };

  const handleSaveResults = async (orderId: string, data: {
    status?: string;
    findings?: string;
    diagnosis?: string;
    images?: string;
    notes?: string;
  }) => {
    try {
      const response = await fetch(`/api/radiology/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Error al guardar resultados');

      toast({
        title: "Éxito",
        description: "Resultados guardados correctamente",
      });

      setIsResultsModalOpen(false);
      loadOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los resultados",
        variant: "error",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pendiente" },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle2, label: "Completado" },
    };
    
    const variant = variants[status as keyof typeof variants] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {variant.label}
      </Badge>
    );
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-[#2E9589]" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Órdenes de Radiología</h2>
            <p className="text-gray-600">
              Gestión de estudios radiológicos
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-transparent border-gray-200">
        <CardHeader className="bg-white">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Lista de Órdenes ({totalCount > 0 ? `${orders.length} de ${totalCount}` : orders.length})
            </CardTitle>
            <Button
              onClick={loadOrders}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full md:w-48 bg-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por paciente..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Spinner size="md" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay órdenes
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all'
                  ? 'No se encontraron órdenes con los filtros aplicados'
                  : 'No hay órdenes de radiología registradas'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">
                        {order.patient.firstName} {order.patient.lastName}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{order.patient.identityNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString('es-HN')}</span>
                      </div>
                      {order.payment.sale?.transactionItems && order.payment.sale.transactionItems.length > 0 && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {order.payment.sale.transactionItems.map((item, index) => (
                              <span key={item.id} className="inline-flex items-center">
                                {item.nombre}
                                {item.quantity > 1 && <span className="ml-1 text-xs text-gray-500">(x{item.quantity})</span>}
                                {index < (order.payment.sale?.transactionItems?.length ?? 0) - 1 && <span className="mx-1">•</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'completed' && (
                      <Button
                        onClick={() => handlePrintOrder(order)}
                        size="sm"
                        variant="outline"
                        className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                      </Button>
                    )}
                    <Button
                      onClick={() => handleOpenResults(order)}
                      size="sm"
                      variant={order.status === 'pending' ? 'default' : 'outline'}
                      className={order.status === 'pending' ? 'bg-[#2E9589] hover:bg-[#2E9589]/90 text-white' : ''}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {order.status === 'pending' ? 'Iniciar' : 'Ver Detalles'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </CardContent>

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <CardContent className="border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Mostrando {orders.length} de {totalCount} órdenes
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10 disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Modal de Resultados */}
      <RadiologyResultsModal
        isOpen={isResultsModalOpen}
        onClose={() => {
          setIsResultsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSave={handleSaveResults}
      />

      {/* Modal de Impresión */}
      <PrintRadiologyReportModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setOrderToPrint(null);
        }}
        order={orderToPrint}
      />
    </div>
  );
}

