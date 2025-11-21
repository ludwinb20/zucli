"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SpinnerWithText, InlineSpinner } from "@/components/ui/spinner";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DollarSign,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Edit,
  RefreshCw,
  Stethoscope,
  ShoppingCart,
  Building2,
  HelpCircle,
  Activity,
  Scissors,
  Trash2,
} from "lucide-react";
import { PaymentWithRelations, PaymentStatus } from "@/types/payments";
import { useToast } from "@/hooks/use-toast";
import PaymentModal from "@/components/PaymentModal";
import PaymentDetailsModal from "@/components/PaymentDetailsModal";
import EditPaymentItemsModal from "@/components/EditPaymentItemsModal";
import RefundModal from "@/components/RefundModal";
import HospitalizationPartialPaymentModal from "@/components/HospitalizationPartialPaymentModal";

export default function PaymentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [payments, setPayments] = useState<PaymentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("pendiente");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState(""); // Input del usuario (con debounce)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditItemsModalOpen, setIsEditItemsModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentWithRelations | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithRelations | null>(null);
  const [rangeWarnings, setRangeWarnings] = useState<string[]>([]);
  const [isPartialPaymentModalOpen, setIsPartialPaymentModalOpen] = useState(false);
  const [selectedHospitalizationId, setSelectedHospitalizationId] = useState<string | null>(null);
  const [hospitalizationStatus, setHospitalizationStatus] = useState<Record<string, { isActive: boolean; hasPendingDays: boolean }>>({});

  // Verificar permisos
  useEffect(() => {
    if (!authLoading && user) {
      const allowedRoles = ["caja", "admin"];
      if (!allowedRoles.includes(user.role.name)) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setCurrentPage(1); // Reset a página 1 al buscar
    }, 500); // Espera 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Verificar estado del rango de facturación
  useEffect(() => {
    checkInvoiceRangeStatus();
  }, []);

  const checkInvoiceRangeStatus = async () => {
    try {
      const response = await fetch('/api/invoice-ranges/status');
      if (response.ok) {
        const data = await response.json();
        if (data.warnings && data.warnings.length > 0) {
          setRangeWarnings(data.warnings);
        }
      }
    } catch (error) {
      console.error("Error checking invoice range status:", error);
    }
  };

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      
      // Construir parámetros de búsqueda
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
      });

      if (statusFilter && statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/payments?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      } else {
        throw new Error("Error al cargar pagos");
      }
    } catch (error) {
      console.error("Error loading payments:", error);
      toast({
        title: "Error",
        description: "Error al cargar los pagos",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm, toast]);

  // Mover el useEffect aquí
  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Cargar estados de hospitalizaciones activas para mostrar botón de facturar días pendientes
  useEffect(() => {
    const loadHospitalizationStatuses = async () => {
      const hospitalizationPayments = payments.filter(p => p.hospitalizationId);
      if (hospitalizationPayments.length === 0) return;

      const statuses: Record<string, { isActive: boolean; hasPendingDays: boolean }> = {};
      
      await Promise.all(
        hospitalizationPayments.map(async (payment) => {
          if (!payment.hospitalizationId) return;
          try {
            const response = await fetch(`/api/hospitalizations/${payment.hospitalizationId}`);
            if (response.ok) {
              const data = await response.json();
              statuses[payment.hospitalizationId] = {
                isActive: data.status === 'iniciada',
                hasPendingDays: data.pendingDays?.hasPendingDays || false,
              };
            }
          } catch (error) {
            console.error(`Error loading hospitalization ${payment.hospitalizationId}:`, error);
          }
        })
      );

      setHospitalizationStatus(statuses);
    };

    if (payments.length > 0) {
      loadHospitalizationStatuses();
    }
  }, [payments]);

  // Reset página al cambiar filtros
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Manejar éxito al crear pago
  const handlePaymentSuccess = () => {
    toast({
      title: "Éxito",
      description: "Pago creado exitosamente",
      variant: "success",
    });
    loadPayments(); // Recargar la lista
  };

  // Abrir modal de detalles
  const handleOpenDetails = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  // Abrir modal de reembolso
  const handleOpenRefund = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setIsRefundModalOpen(true);
  };

  // Cerrar modal de detalles
  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedPayment(null);
  };

  // Abrir modal de editar items
  const handleOpenEditItems = (payment: PaymentWithRelations) => {
    setSelectedPayment(payment);
    setIsEditItemsModalOpen(true);
  };

  // Cerrar modal de editar items
  const handleCloseEditItems = () => {
    setIsEditItemsModalOpen(false);
    setSelectedPayment(null);
  };

  // Manejar actualización de estado del pago
  const handlePaymentUpdated = () => {
    toast({
      title: "Éxito",
      description: "Pago actualizado exitosamente",
      variant: "success",
    });
    loadPayments(); // Recargar la lista
    handleCloseDetails();
  };

  // Manejar actualización de items
  const handleItemsUpdated = () => {
    toast({
      title: "Éxito",
      description: "Items actualizados exitosamente",
      variant: "success",
    });
    loadPayments(); // Recargar la lista
    handleCloseEditItems();
  };

  // Abrir modal de eliminar
  const handleOpenDelete = (payment: PaymentWithRelations) => {
    setPaymentToDelete(payment);
    setIsDeleteModalOpen(true);
  };

  // Cerrar modal de eliminar
  const handleCloseDelete = () => {
    setIsDeleteModalOpen(false);
    setPaymentToDelete(null);
  };

  // Abrir modal de pago parcial de hospitalización
  const handleOpenPartialPayment = (hospitalizationId: string) => {
    setSelectedHospitalizationId(hospitalizationId);
    setIsPartialPaymentModalOpen(true);
  };

  // Cerrar modal de pago parcial
  const handleClosePartialPayment = () => {
    setIsPartialPaymentModalOpen(false);
    setSelectedHospitalizationId(null);
  };

  // Manejar éxito del pago parcial
  const handlePartialPaymentSuccess = () => {
    loadPayments(); // Recargar pagos
    handleClosePartialPayment();
  };

  // Manejar eliminación de pago
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/payments/${paymentToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al desactivar el pago");
      }

      toast({
        title: "Éxito",
        description: "Pago desactivado exitosamente",
        variant: "success",
      });

      loadPayments(); // Recargar la lista
      handleCloseDelete();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar el pago",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Los pagos ya vienen filtrados del backend, no necesitamos filtrar en el frontend

  const getStatusBadge = (status: PaymentStatus) => {
    const config: Record<PaymentStatus, {
      className: string;
      icon: React.ReactNode;
      label: string;
    }> = {
      pendiente: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock size={12} />,
        label: "Pendiente",
      },
      paid: {
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle2 size={12} />,
        label: "Pagado",
      },
      cancelado: {
        className: "bg-red-100 text-red-800 border-red-200",
        icon: <XCircle size={12} />,
        label: "Cancelado",
      },
    };

    const statusConfig = config[status] || {
      className: "bg-gray-100 text-gray-800 border-gray-200",
      icon: <HelpCircle size={12} />,
      label: status || "Desconocido",
    };

    return (
      <Badge className={`text-xs flex items-center space-x-1 ${statusConfig.className}`}>
        {statusConfig.icon}
        <span>{statusConfig.label}</span>
      </Badge>
    );
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
              Gestión de Pagos
            </h2>
            <p className="text-gray-600">
              Administra los pagos y cobros de los pacientes
            </p>
          </div>
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center space-x-2 bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Pago</span>
          </Button>
        </div>
      </div>

      {/* Invoice Range Warnings Banner */}
      {rangeWarnings.length > 0 && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-start space-x-3">
            <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Advertencias del Sistema de Facturación
              </h3>
              <ul className="space-y-1">
                {rangeWarnings.map((warning, index) => (
                  <li key={index} className="text-sm text-red-700">
                    • {warning}
                  </li>
                ))}
              </ul>
              {user?.role.name === 'admin' && (
                <p className="text-xs text-red-600 mt-2">
                  Por favor, contacta al administrador para configurar un nuevo rango de facturación.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <Card className="bg-transparent border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Lista de Pagos
            </CardTitle>
            <div className="flex items-center space-x-4">
              {/* Filtro por Estado */}
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-48 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              {/* Barra de búsqueda */}
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por nombre o identidad..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-80 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>

              {/* Botón de recargar */}
              <Button
                onClick={() => {
                  loadPayments();
                  checkInvoiceRangeStatus();
                }}
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
              <SpinnerWithText text="Cargando pagos..." />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No se encontraron pagos</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta con otros términos de búsqueda o filtros"
                  : "No hay pagos registrados en el sistema"}
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
                {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-5 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Icono */}
                    <div className="w-14 h-14 bg-[#2E9589] text-white rounded-full flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-7 w-7" />
                    </div>

                    {/* Información del pago */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {payment.patient.firstName} {payment.patient.lastName} - 
                          {(() => {
                            const totalRefunded = payment.refunds?.reduce((sum, r) => sum + r.amount, 0) || 0;
                            const netTotal = payment.total - totalRefunded;
                            return totalRefunded > 0 ? (
                              <span>
                                <span className="text-gray-400 line-through ml-2">{formatCurrency(payment.total)}</span>
                                <span className="text-[#2E9589] ml-2">{formatCurrency(netTotal)}</span>
                              </span>
                            ) : (
                              <span className="text-[#2E9589] ml-2">{formatCurrency(payment.total)}</span>
                            );
                          })()}
                        </h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600 flex-wrap">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>ID: {payment.patient.identityNumber}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(payment.createdAt)}</span>
                        </div>
                        {payment.items && payment.items.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Receipt className="h-4 w-4" />
                            <span>
                              {payment.items.length} {payment.items.length === 1 ? "item" : "items"}
                            </span>
                          </div>
                        )}
                        {/* Indicador de fuente */}
                        <div className="flex items-center space-x-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium flex items-center gap-1">
                            {payment.consultationId ? (
                              <>
                                <Stethoscope size={12} />
                                <span>Consulta</span>
                              </>
                            ) : payment.saleId ? (
                              <>
                                <ShoppingCart size={12} />
                                <span>Venta</span>
                              </>
                            ) : payment.hospitalizationId ? (
                              <>
                                <Building2 size={12} />
                                <span>Hospital.</span>
                              </>
                            ) : payment.surgeryId ? (
                              <>
                                <Scissors size={12} />
                                <span>Cirugía</span>
                              </>
                            ) : (
                              <>
                                <HelpCircle size={12} />
                                <span>N/A</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    {/* Botón de facturar días pendientes para hospitalizaciones activas */}
                    {payment.hospitalizationId && 
                     (user?.role.name === "caja" || user?.role.name === "admin") &&
                     hospitalizationStatus[payment.hospitalizationId]?.isActive &&
                     hospitalizationStatus[payment.hospitalizationId]?.hasPendingDays && (
                      <Button
                        onClick={() => handleOpenPartialPayment(payment.hospitalizationId!)}
                        variant="outline"
                        size="sm"
                        className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
                        title="Facturar días pendientes"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="text-xs">Facturar Pendientes</span>
                      </Button>
                    )}
                    {payment.status === "pendiente" && (
                      <>
                        {(user?.role.name === "caja" || user?.role.name === "admin") && (
                          <>
                      <Button
                        onClick={() => handleOpenEditItems(payment)}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              title="Editar items"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                            <Button
                              onClick={() => handleOpenDelete(payment)}
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              title="Desactivar pago"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    {payment.status === "paid" && (
                      <Button
                        onClick={() => handleOpenRefund(payment)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        title="Registrar reembolso"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleOpenDetails(payment)}
                      variant="outline"
                      size="sm"
                      className="border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
                      title="Ver detalles"
                    >
                      <FileText className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Mostrando página {currentPage} de {totalPages} ({totalCount} {totalCount === 1 ? "pago" : "pagos"} en total)
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

      {/* Modal de Pago */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Modal de Detalles del Pago */}
      <PaymentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        payment={selectedPayment}
        onUpdate={handlePaymentUpdated}
      />

      {/* Modal de Editar Items */}
      <EditPaymentItemsModal
        isOpen={isEditItemsModalOpen}
        onClose={handleCloseEditItems}
        payment={selectedPayment}
        onUpdate={handleItemsUpdated}
      />

      {/* Modal de Reembolso */}
      {selectedPayment && (
        <RefundModal
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedPayment(null);
          }}
          paymentId={selectedPayment.id}
          paymentTotal={selectedPayment.total}
          totalRefunded={selectedPayment.refunds?.reduce((sum, r) => sum + r.amount, 0) || 0}
          onSave={handlePaymentUpdated}
        />
      )}

      {/* Modal de Pago Parcial de Hospitalización */}
      {selectedHospitalizationId && (
        <HospitalizationPartialPaymentModal
          isOpen={isPartialPaymentModalOpen}
          onClose={handleClosePartialPayment}
          hospitalizationId={selectedHospitalizationId}
          onSuccess={handlePartialPaymentSuccess}
        />
      )}

      {/* Modal de Confirmación para Eliminar */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          handleCloseDelete();
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              ¿Desactivar pago?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              El pago será desactivado y ya no aparecerá en las listas, reportes ni estadísticas. 
              Sin embargo, el registro se mantendrá en el sistema por razones de auditoría.
              {paymentToDelete?.invoices && paymentToDelete.invoices.length > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  ⚠️ Este pago tiene facturas asociadas y no puede ser desactivado.
                </span>
              )}
              <br />
              <br />
              Pago de{" "}
              <strong>
                {paymentToDelete?.patient.firstName} {paymentToDelete?.patient.lastName}
              </strong>{" "}
              por un total de{" "}
              <strong className="text-[#2E9589]">
                L {paymentToDelete?.total.toFixed(2) || "0.00"}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCloseDelete}
              disabled={isDeleting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <InlineSpinner size="sm" className="mr-2" />
                  Desactivando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Desactivar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

