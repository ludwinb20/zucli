"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Tag,
  Stethoscope,
  Save,
  X,
  FileText,
  Upload,
  AlertCircle,
  CheckCircle,
  Calendar,
  Hash,
  ClipboardList,
  Bed,
  DoorOpen,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InlineSpinner } from "@/components/ui/spinner";
import { PdfUploadDropzone } from "@/components/PdfUploadDropzone";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { WeekDaySelector, getDayName } from "@/components/WeekDaySelector";

interface Specialty {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  specialtyDays?: Array<{ dayOfWeek: number }>;
  createdAt: string;
  updatedAt: string;
}

interface TagItem {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceRange {
  id: string;
  cai: string;
  fechaLimite: string;
  fechaLimiteEmision: string;
  puntoEmision: string;
  rangoInicio: string;
  rangoFin: string;
  cantidad: number;
  cantidadAutorizada: number;
  correlativoActual: number;
  estado: string;
  rtn?: string;
  razonSocial?: string;
}

interface ConsultaEspecialidad {
  id: string;
  specialtyId: string;
  serviceItemId: string;
  priceId?: string;
  variantId?: string;
  variant?: {
    id: string;
    name: string;
    price: number;
  };
  serviceItem: {
    id: string;
    name: string;
    basePrice: number;
    variants?: Array<{
      id: string;
      name: string;
      price: number;
      isActive: boolean;
    }>;
  };
}

interface ServiceItem {
  id: string;
  name: string;
  type: string;
  basePrice: number;
  isActive: boolean;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  }>;
}

export default function AdminPanelPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Estados
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoiceRange, setInvoiceRange] = useState<InvoiceRange | null>(null);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [consultaEspecialidades, setConsultaEspecialidades] = useState<ConsultaEspecialidad[]>([]);
  const [prices, setPrices] = useState<ServiceItem[]>([]);
  const [radiologyTagId, setRadiologyTagId] = useState<string>("");
  const [rooms, setRooms] = useState<Array<{ id: string; number: string; status: string }>>([]);
  const [salaDoctors, setSalaDoctors] = useState<Array<{ id: string; name: string }>>([]);
  const [hospitalizationDailyItemId, setHospitalizationDailyItemId] = useState<string>("");

  // Modales
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isConsultaModalOpen, setIsConsultaModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isSalaDoctorModalOpen, setIsSalaDoctorModalOpen] = useState(false);
  const [selectedSpecialtyForConsulta, setSelectedSpecialtyForConsulta] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<{ id: string; number: string; status: string } | null>(null);
  const [selectedSalaDoctor, setSelectedSalaDoctor] = useState<{ id: string; name: string } | null>(null);
  
  // Diálogos de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Formularios
  const [specialtyForm, setSpecialtyForm] = useState({
    id: "",
    name: "",
    description: "",
    isActive: true,
  });
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [tagForm, setTagForm] = useState({
    id: "",
    name: "",
    description: "",
  });

  const [consultaForm, setConsultaForm] = useState({
    priceId: "",
    variantId: "",
  });

  const [saving, setSaving] = useState(false);

  // Verificar permisos
  useEffect(() => {
    if (!authLoading && user?.role?.name !== "admin") {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const loadInvoiceRange = async () => {
    try {
      setRangeLoading(true);
      const response = await fetch("/api/invoice-ranges");
      if (response.ok) {
        const data = await response.json();
        // Buscar el rango activo
        const activeRange = data.find((r: InvoiceRange) => r.estado === "activo");
        setInvoiceRange(activeRange || null);
      }
    } catch (error) {
      console.error("Error loading invoice range:", error);
    } finally {
      setRangeLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Cargar especialidades
      const specialtiesRes = await fetch("/api/specialties");
      if (specialtiesRes.ok) {
        const data = await specialtiesRes.json();
        setSpecialties(data.specialties || []);
      }

      // Cargar tags
      const tagsRes = await fetch("/api/tags");
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        setTags(data.tags || []);
      }

      // Cargar precios
      const pricesRes = await fetch("/api/prices");
      if (pricesRes.ok) {
        const data = await pricesRes.json();
        setPrices(data.prices || []);
      }

      // Cargar consultas por especialidad
      const consultaRes = await fetch("/api/consulta-especialidad");
      if (consultaRes.ok) {
        const data = await consultaRes.json();
        setConsultaEspecialidades(data || []);
      }

      // Cargar rango de facturación
      await loadInvoiceRange();

      // Cargar configuración de radiología
      const configRes = await fetch("/api/config?key=radiology");
      if (configRes.ok) {
        const data = await configRes.json();
        setRadiologyTagId(data.value?.radiologyTagId || "");
      }

      // Cargar habitaciones
      const roomsRes = await fetch("/api/rooms");
      if (roomsRes.ok) {
        const data = await roomsRes.json();
        setRooms(data || []);
      }

      // Cargar doctores de sala
      const salaDoctorsRes = await fetch("/api/sala-doctors");
      if (salaDoctorsRes.ok) {
        const data = await salaDoctorsRes.json();
        setSalaDoctors(data || []);
      }

      // Cargar configuración de item diario de hospitalización
      const hospConfigRes = await fetch("/api/config?key=hospitalization_daily_rate");
      if (hospConfigRes.ok) {
        const data = await hospConfigRes.json();
        setHospitalizationDailyItemId(data.value?.itemId || "");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Cargar datos
  useEffect(() => {
    if (user?.role?.name === "admin") {
      loadData();
    }
  }, [user, loadData]);

  // ============================================
  // ESPECIALIDADES
  // ============================================

  const handleOpenSpecialtyModal = (specialty?: Specialty) => {
    if (specialty) {
      setSpecialtyForm({
        id: specialty.id,
        name: specialty.name,
        description: specialty.description || "",
        isActive: specialty.isActive,
      });
      // Cargar días si existen
      setSelectedDays(specialty.specialtyDays?.map(d => d.dayOfWeek) || []);
    } else {
      setSpecialtyForm({
        id: "",
        name: "",
        description: "",
        isActive: true,
      });
      setSelectedDays([]);
    }
    setIsSpecialtyModalOpen(true);
  };

  const handleSaveSpecialty = async () => {
    try {
      if (!specialtyForm.name.trim()) {
        toast({
          title: "Error",
          description: "El nombre es requerido",
          variant: "error",
        });
        return;
      }

      setSaving(true);

      const url = specialtyForm.id
        ? `/api/specialties/${specialtyForm.id}`
        : "/api/specialties";

      const method = specialtyForm.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: specialtyForm.name,
          description: specialtyForm.description || null,
          isActive: specialtyForm.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      const result = await response.json();
      const specialtyId = result.specialty?.id || specialtyForm.id;

      // Guardar días de la especialidad
      if (specialtyId && selectedDays.length > 0) {
        await fetch(`/api/specialties/${specialtyId}/days`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ days: selectedDays })
        });
      }

      toast({
        title: "Éxito",
        description: `Especialidad ${specialtyForm.id ? "actualizada" : "creada"} exitosamente`,
        variant: "success",
      });

      setIsSpecialtyModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving specialty:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al guardar la especialidad";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSpecialty = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Especialidad",
      description: "¿Estás seguro de eliminar esta especialidad? Esta acción no se puede deshacer.",
      onConfirm: () => deleteSpecialty(id),
    });
  };

  const deleteSpecialty = async (id: string) => {
    try {
      const response = await fetch(`/api/specialties/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      toast({
        title: "Éxito",
        description: "Especialidad eliminada exitosamente",
        variant: "success",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting specialty:", error);
      toast({
        title: "Error",
        description: "Error al eliminar la especialidad",
        variant: "error",
      });
    }
  };

  // ============================================
  // TAGS
  // ============================================

  const handleOpenTagModal = (tag?: TagItem) => {
    if (tag) {
      setTagForm({
        id: tag.id,
        name: tag.name,
        description: tag.description || "",
      });
    } else {
      setTagForm({
        id: "",
        name: "",
        description: "",
      });
    }
    setIsTagModalOpen(true);
  };

  const handleSaveTag = async () => {
    try {
      if (!tagForm.name.trim()) {
        toast({
          title: "Error",
          description: "El nombre es requerido",
          variant: "error",
        });
        return;
      }

      setSaving(true);

      const url = tagForm.id ? `/api/tags/${tagForm.id}` : "/api/tags";
      const method = tagForm.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tagForm.name,
          description: tagForm.description || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      toast({
        title: "Éxito",
        description: `Tag ${tagForm.id ? "actualizado" : "creado"} exitosamente`,
        variant: "success",
      });

      setIsTagModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving tag:", error);
      const errorMessage = error instanceof Error ? error.message : "Error al guardar el tag";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Tag",
      description: "¿Estás seguro de eliminar este tag? Esta acción no se puede deshacer.",
      onConfirm: () => deleteTag(id),
    });
  };

  const deleteTag = async (id: string) => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      toast({
        title: "Éxito",
        description: "Tag eliminado exitosamente",
        variant: "success",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting tag:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el tag",
        variant: "error",
      });
    }
  };

  // ============================================
  // HABITACIONES
  // ============================================

  const [roomForm, setRoomForm] = useState({ id: "", number: "", status: "available" });

  const handleOpenRoomModal = (room?: { id: string; number: string; status: string }) => {
    if (room) {
      setRoomForm(room);
      setSelectedRoom(room);
    } else {
      setRoomForm({ id: "", number: "", status: "available" });
      setSelectedRoom(null);
    }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async () => {
    try {
      if (!roomForm.number.trim()) {
        toast({
          title: "Error",
          description: "El número de habitación es requerido",
          variant: "error",
        });
        return;
      }

      setSaving(true);

      const url = roomForm.id ? `/api/rooms/${roomForm.id}` : "/api/rooms";
      const method = roomForm.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: roomForm.number.trim(),
          status: roomForm.status,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      toast({
        title: "Éxito",
        description: `Habitación ${roomForm.id ? "actualizada" : "creada"} exitosamente`,
        variant: "success",
      });

      setIsRoomModalOpen(false);
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al guardar la habitación";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Habitación",
      description: "¿Estás seguro de eliminar esta habitación? Esta acción no se puede deshacer.",
      onConfirm: () => deleteRoom(id),
    });
  };

  const deleteRoom = async (id: string) => {
    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar");
      }

      toast({
        title: "Éxito",
        description: "Habitación eliminada exitosamente",
        variant: "success",
      });

      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar la habitación";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    }
  };

  // ============================================
  // DOCTORES DE SALA
  // ============================================

  const [salaDoctorForm, setSalaDoctorForm] = useState({ id: "", name: "" });

  const handleOpenSalaDoctorModal = (doctor?: { id: string; name: string }) => {
    if (doctor) {
      setSalaDoctorForm(doctor);
      setSelectedSalaDoctor(doctor);
    } else {
      setSalaDoctorForm({ id: "", name: "" });
      setSelectedSalaDoctor(null);
    }
    setIsSalaDoctorModalOpen(true);
  };

  const handleSaveSalaDoctor = async () => {
    try {
      if (!salaDoctorForm.name.trim()) {
        toast({
          title: "Error",
          description: "El nombre del doctor es requerido",
          variant: "error",
        });
        return;
      }

      setSaving(true);

      const url = salaDoctorForm.id ? `/api/sala-doctors/${salaDoctorForm.id}` : "/api/sala-doctors";
      const method = salaDoctorForm.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: salaDoctorForm.name.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar");
      }

      toast({
        title: "Éxito",
        description: `Doctor ${salaDoctorForm.id ? "actualizado" : "creado"} exitosamente`,
        variant: "success",
      });

      setIsSalaDoctorModalOpen(false);
      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al guardar el doctor";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSalaDoctor = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Doctor de Sala",
      description: "¿Estás seguro de eliminar este doctor? Esta acción no se puede deshacer.",
      onConfirm: () => deleteSalaDoctor(id),
    });
  };

  const deleteSalaDoctor = async (id: string) => {
    try {
      const response = await fetch(`/api/sala-doctors/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar");
      }

      toast({
        title: "Éxito",
        description: "Doctor eliminado exitosamente",
        variant: "success",
      });

      loadData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar el doctor";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    }
  };

  // ============================================
  // CONSULTA POR ESPECIALIDAD
  // ============================================

  const handleOpenConsultaModal = (specialtyId: string) => {
    const existing = consultaEspecialidades.find(
      (ce) => ce.specialtyId === specialtyId
    );

    if (existing) {
      setConsultaForm({
        priceId: existing.priceId || "",
        variantId: existing.variantId || "",
      });
    } else {
      setConsultaForm({
        priceId: "",
        variantId: "",
      });
    }

    setSelectedSpecialtyForConsulta(specialtyId);
    setIsConsultaModalOpen(true);
  };

  const handleSaveConsulta = async () => {
    try {
      setSaving(true);

      if (!consultaForm.priceId) {
        toast({
          title: "Error",
          description: "Debes seleccionar un precio",
          variant: "error",
        });
        return;
      }

      const response = await fetch("/api/consulta-especialidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          specialtyId: selectedSpecialtyForConsulta,
          priceId: consultaForm.priceId,
          variantId: consultaForm.variantId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      toast({
        title: "Éxito",
        description: "Configuración guardada exitosamente",
        variant: "success",
      });

      setIsConsultaModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving consulta:", error);
      toast({
        title: "Error",
        description: "Error al guardar la configuración",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConsulta = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Configuración",
      description: "¿Estás seguro de eliminar esta configuración? La consulta ya no se agregará automáticamente.",
      onConfirm: () => deleteConsulta(id),
    });
  };

  const deleteConsulta = async (id: string) => {
    try {
      const response = await fetch(`/api/consulta-especialidad/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar");
      }

      toast({
        title: "Éxito",
        description: "Configuración eliminada exitosamente",
        variant: "success",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting consulta:", error);
      toast({
        title: "Error",
        description: "Error al eliminar la configuración",
        variant: "error",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <InlineSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-[#2E9589]" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Panel General</h2>
            <p className="text-gray-600">
              Administración de especialidades y categorías
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE AUTORIZACIÓN SAR */}
      <Card className="mb-6 bg-white border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-[#2E9589]" />
              <CardTitle className="text-lg font-semibold text-gray-900">
                Autorización SAR
              </CardTitle>
            </div>
            <Button
              onClick={() => setIsPdfModalOpen(true)}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              size="sm"
            >
              <Upload size={16} className="mr-2" />
              Cargar Nueva Autorización
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {rangeLoading ? (
            <div className="flex items-center justify-center py-8">
              <InlineSpinner size="lg" />
            </div>
          ) : !invoiceRange ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                No hay ninguna autorización SAR activa
              </p>
              <Button
                onClick={() => setIsPdfModalOpen(true)}
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Upload size={16} className="mr-2" />
                Cargar Autorización
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Estado de la autorización */}
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">
                  Autorización Activa
                </span>
              </div>

              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">RTN</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {invoiceRange.rtn}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Razón Social</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {invoiceRange.razonSocial}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Punto de Emisión</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {invoiceRange.puntoEmision}
                  </p>
                </div>
              </div>

              {/* CAI */}
              <div className="space-y-1 bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">CAI</p>
                <p className="text-sm font-mono font-semibold text-gray-900">
                  {invoiceRange.cai}
                </p>
              </div>

              {/* Fecha límite */}
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Fecha límite de emisión:</span>
                <span className="font-semibold text-gray-900">
                  {new Date(invoiceRange.fechaLimiteEmision).toLocaleDateString("es-HN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {/* Progress bar de correlativos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Hash className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      Correlativos Utilizados
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {invoiceRange.correlativoActual - parseInt(invoiceRange.rangoInicio) + 1} /{" "}
                    {invoiceRange.cantidadAutorizada}
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="relative">
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        ((invoiceRange.correlativoActual - parseInt(invoiceRange.rangoInicio) + 1) /
                          invoiceRange.cantidadAutorizada) *
                          100 >
                        90
                          ? "bg-red-500"
                          : ((invoiceRange.correlativoActual - parseInt(invoiceRange.rangoInicio) + 1) /
                                invoiceRange.cantidadAutorizada) *
                              100 >
                            75
                          ? "bg-yellow-500"
                          : "bg-[#2E9589]"
                      }`}
                      style={{
                        width: `${Math.min(
                          ((invoiceRange.correlativoActual - parseInt(invoiceRange.rangoInicio) + 1) /
                            invoiceRange.cantidadAutorizada) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>
                      {invoiceRange.puntoEmision}-{invoiceRange.puntoEmision}-01-
                      {invoiceRange.rangoInicio.toString().padStart(8, "0")}
                    </span>
                    <span>
                      {invoiceRange.puntoEmision}-{invoiceRange.puntoEmision}-01-
                      {invoiceRange.rangoFin.toString().padStart(8, "0")}
                    </span>
                  </div>
                </div>

                {/* Correlativos restantes */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Correlativos disponibles:</span>
                  <span
                    className={`font-semibold ${
                      parseInt(invoiceRange.rangoFin) - invoiceRange.correlativoActual < 50
                        ? "text-red-600"
                        : parseInt(invoiceRange.rangoFin) - invoiceRange.correlativoActual < 100
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {parseInt(invoiceRange.rangoFin) - invoiceRange.correlativoActual}
                  </span>
                </div>
              </div>

              {/* Advertencias */}
              {(parseInt(invoiceRange.rangoFin) - invoiceRange.correlativoActual < 50 ||
                new Date(invoiceRange.fechaLimiteEmision).getTime() - Date.now() <
                  15 * 24 * 60 * 60 * 1000) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                        Atención Requerida
                      </h4>
                      <ul className="space-y-1 text-sm text-yellow-700">
                        {parseInt(invoiceRange.rangoFin) - invoiceRange.correlativoActual < 50 && (
                          <li>• Quedan menos de 50 correlativos disponibles</li>
                        )}
                        {new Date(invoiceRange.fechaLimiteEmision).getTime() - Date.now() <
                          15 * 24 * 60 * 60 * 1000 && (
                          <li>• La autorización vence en menos de 15 días</li>
                        )}
                      </ul>
                      <p className="text-xs text-yellow-600 mt-2">
                        Se recomienda cargar una nueva autorización SAR
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN DE CONFIGURACIÓN */}
      <Card className="mb-6 bg-white border-gray-200">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-[#2E9589]" />
            <CardTitle className="text-lg font-semibold text-gray-900">
              Configuración del Sistema
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="radiologyTag" className="text-sm font-medium text-gray-700">
                Tag de Rayos X / Radiología
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Selecciona el tag que se usará para filtrar los servicios de radiología en el módulo de pagos
              </p>
              <div className="flex gap-2">
                <select
                  id="radiologyTag"
                  value={radiologyTagId}
                  onChange={(e) => setRadiologyTagId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
                >
                  <option value="">Sin configurar</option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/config", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          key: "radiology",
                          value: { radiologyTagId }
                        }),
                      });

                      if (!response.ok) throw new Error();

                      toast({
                        title: "Configuración guardada",
                        description: "El tag de radiología se ha configurado correctamente",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "No se pudo guardar la configuración",
                        variant: "error",
                      });
                    }
                  }}
                  className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>

            {/* Configuración de Hospitalización */}
            <div className="pt-4 border-t border-gray-200">
              <Label htmlFor="hospitalizationDailyItem" className="text-sm font-medium text-gray-700">
                Item de Cobro Diario para Hospitalización
              </Label>
              <p className="text-xs text-gray-500 mb-2">
                Selecciona el servicio que se cobrará por cada día de estancia hospitalaria
              </p>
              <div className="flex gap-2">
                <select
                  id="hospitalizationDailyItem"
                  value={hospitalizationDailyItemId}
                  onChange={(e) => setHospitalizationDailyItemId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
                >
                  <option value="">Sin configurar</option>
                  {prices.filter(p => p.type === 'servicio' && p.isActive).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} - L{item.basePrice.toFixed(2)}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/config", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          key: "hospitalization_daily_rate",
                          value: { itemId: hospitalizationDailyItemId }
                        }),
                      });

                      if (!response.ok) throw new Error();

                      toast({
                        title: "Configuración guardada",
                        description: "El item de hospitalización se ha configurado correctamente",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "No se pudo guardar la configuración",
                        variant: "error",
                      });
                    }
                  }}
                  className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ESPECIALIDADES */}
        <Card className="bg-transparent border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-[#2E9589]" />
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Especialidades ({specialties.length})
                </CardTitle>
              </div>
              <Button
                onClick={() => handleOpenSpecialtyModal()}
                size="sm"
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus size={16} className="mr-1" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {specialties.length > 0 && specialties.map((specialty) => (
                <div
                  key={specialty.id}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                    specialty.isActive
                      ? "bg-white border-gray-200"
                      : "bg-gray-50 border-gray-300 opacity-75"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium ${specialty.isActive ? "text-gray-900" : "text-gray-600"}`}>
                        {specialty.name}
                      </h3>
                      {!specialty.isActive && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-medium">
                          Inactiva
                        </span>
                      )}
                      {consultaEspecialidades.find((ce) => ce.specialtyId === specialty.id) && (
                        <span className="text-xs bg-[#2E9589]/10 text-[#2E9589] px-2 py-0.5 rounded font-medium">
                          Consulta configurada
                        </span>
                      )}
                    </div>
                    {specialty.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {specialty.description}
                      </p>
                    )}
                    {specialty.specialtyDays && specialty.specialtyDays.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar size={14} className="text-gray-500" />
                        <p className="text-xs text-gray-500">
                          {specialty.specialtyDays.map(d => getDayName(d.dayOfWeek)).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleOpenConsultaModal(specialty.id)}
                      variant="outline"
                      size="sm"
                      className="border-[#2E9589]/30 text-[#2E9589] hover:bg-[#2E9589]/10"
                      title="Configurar consulta automática"
                    >
                      <ClipboardList size={14} />
                    </Button>
                    <Button
                      onClick={() => handleOpenSpecialtyModal(specialty)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      onClick={() => handleDeleteSpecialty(specialty.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}

              {specialties.length === 0 && (
                <div className="text-center py-12">
                  <Stethoscope size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay especialidades registradas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TAGS */}
        <Card className="bg-transparent border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="h-5 w-5 text-[#2E9589]" />
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Tags / Categorías ({tags.length})
                </CardTitle>
              </div>
              <Button
                onClick={() => handleOpenTagModal()}
                size="sm"
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus size={16} className="mr-1" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{tag.name}</h3>
                    {tag.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {tag.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleOpenTagModal(tag)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      onClick={() => handleDeleteTag(tag.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}

              {tags.length === 0 && (
                <div className="text-center py-12">
                  <Tag size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay tags registrados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* HABITACIONES */}
        <Card className="bg-transparent border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bed className="h-5 w-5 text-[#2E9589]" />
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Habitaciones ({rooms.length})
                </CardTitle>
              </div>
              <Button
                onClick={() => handleOpenRoomModal()}
                size="sm"
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus size={16} className="mr-1" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${room.status === 'available' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <DoorOpen className={`h-4 w-4 ${room.status === 'available' ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Habitación {room.number}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {room.status === 'available' ? 'Disponible' : 'Ocupada'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleOpenRoomModal(room)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                    >
                      <Edit size={14} />
                    </Button>
                    {room.status === 'available' && (
                      <Button
                        onClick={() => handleDeleteRoom(room.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {rooms.length === 0 && (
                <div className="text-center py-12">
                  <Bed size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay habitaciones registradas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DOCTORES DE SALA */}
        <Card className="bg-transparent border-gray-200">
          <CardHeader className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-[#2E9589]" />
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Doctores de Sala ({salaDoctors.length})
                </CardTitle>
              </div>
              <Button
                onClick={() => handleOpenSalaDoctorModal()}
                size="sm"
                className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
              >
                <Plus size={16} className="mr-1" />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {salaDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Stethoscope className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{doctor.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleOpenSalaDoctorModal(doctor)}
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      onClick={() => handleDeleteSalaDoctor(doctor.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}

              {salaDoctors.length === 0 && (
                <div className="text-center py-12">
                  <Stethoscope size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay doctores de sala registrados</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MODAL DE ESPECIALIDAD */}
      <Dialog open={isSpecialtyModalOpen} onOpenChange={setIsSpecialtyModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {specialtyForm.id ? "Editar" : "Nueva"} Especialidad
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="specialty-name">Nombre *</Label>
              <Input
                id="specialty-name"
                value={specialtyForm.name}
                onChange={(e) =>
                  setSpecialtyForm({ ...specialtyForm, name: e.target.value })
                }
                placeholder="Ej: Cardiología"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty-description">Descripción</Label>
              <Input
                id="specialty-description"
                value={specialtyForm.description}
                onChange={(e) =>
                  setSpecialtyForm({
                    ...specialtyForm,
                    description: e.target.value,
                  })
                }
                placeholder="Descripción de la especialidad"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="specialty-active"
                checked={specialtyForm.isActive}
                onChange={(e) =>
                  setSpecialtyForm({
                    ...specialtyForm,
                    isActive: e.target.checked,
                  })
                }
                className="rounded border-gray-300"
              />
              <Label htmlFor="specialty-active" className="cursor-pointer">
                Activa
              </Label>
            </div>

            {/* Selector de Días de la Semana */}
            <div className="pt-4 border-t border-gray-200">
              <WeekDaySelector
                selectedDays={selectedDays}
                onChange={setSelectedDays}
                disabled={saving}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setIsSpecialtyModalOpen(false)}
              variant="outline"
              disabled={saving}
            >
              <X size={16} className="mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSpecialty}
              disabled={saving}
              className="text-white bg-[#2E9589] hover:bg-[#2E9589]/90"
            >
              {saving ? (
                <InlineSpinner size="sm" className="mr-2" />
              ) : (
                <Save size={16} className="mr-1" />
              )}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE TAG */}
      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tagForm.id ? "Editar" : "Nuevo"} Tag</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nombre *</Label>
              <Input
                id="tag-name"
                value={tagForm.name}
                onChange={(e) =>
                  setTagForm({ ...tagForm, name: e.target.value })
                }
                placeholder="Ej: especialidad, rayos_x"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-description">Descripción</Label>
              <Input
                id="tag-description"
                value={tagForm.description}
                onChange={(e) =>
                  setTagForm({ ...tagForm, description: e.target.value })
                }
                placeholder="Descripción del tag"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setIsTagModalOpen(false)}
              variant="outline"
              disabled={saving}
            >
              <X size={16} className="mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTag}
              disabled={saving}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {saving ? (
                <InlineSpinner size="sm" className="mr-2" />
              ) : (
                <Save size={16} className="mr-1" />
              )}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE HABITACIÓN */}
      <Dialog open={isRoomModalOpen} onOpenChange={setIsRoomModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{roomForm.id ? "Editar" : "Nueva"} Habitación</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-number">Número de Habitación *</Label>
              <Input
                id="room-number"
                value={roomForm.number}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, number: e.target.value })
                }
                placeholder="Ej: 101, A1, Sala 1"
              />
            </div>

            {roomForm.id && roomForm.status === 'available' && (
              <div className="space-y-2">
                <Label htmlFor="room-status">Estado</Label>
                <select
                  id="room-status"
                  value={roomForm.status}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, status: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
                >
                  <option value="available">Disponible</option>
                  <option value="occupied">Ocupada</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setIsRoomModalOpen(false)}
              variant="outline"
              disabled={saving}
            >
              <X size={16} className="mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRoom}
              disabled={saving}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {saving ? (
                <InlineSpinner size="sm" className="mr-2" />
              ) : (
                <Save size={16} className="mr-1" />
              )}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DOCTOR DE SALA */}
      <Dialog open={isSalaDoctorModalOpen} onOpenChange={setIsSalaDoctorModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{salaDoctorForm.id ? "Editar" : "Nuevo"} Doctor de Sala</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doctor-name">Nombre Completo *</Label>
              <Input
                id="doctor-name"
                value={salaDoctorForm.name}
                onChange={(e) =>
                  setSalaDoctorForm({ ...salaDoctorForm, name: e.target.value })
                }
                placeholder="Ej: Dr. Juan Pérez"
              />
              <p className="text-xs text-gray-500">
                Estos doctores no tendrán usuario en el sistema
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setIsSalaDoctorModalOpen(false)}
              variant="outline"
              disabled={saving}
            >
              <X size={16} className="mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSalaDoctor}
              disabled={saving}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {saving ? (
                <InlineSpinner size="sm" className="mr-2" />
              ) : (
                <Save size={16} className="mr-1" />
              )}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIGURACIÓN DE CONSULTA */}
      <Dialog open={isConsultaModalOpen} onOpenChange={setIsConsultaModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Configurar Consulta Automática
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-sm text-gray-600 mb-4">
              Selecciona el precio que se agregará automáticamente cuando un especialista de esta área inicie una consulta médica.
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultaPrice">Precio / Servicio *</Label>
              <select
                id="consultaPrice"
                value={consultaForm.priceId}
                onChange={(e) => {
                  setConsultaForm({
                    priceId: e.target.value,
                    variantId: "",
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
              >
                <option value="">Seleccionar precio...</option>
                {prices
                  .filter((p) => p.isActive)
                  .map((price) => (
                    <option key={price.id} value={price.id}>
                      {price.name} - L {price.basePrice.toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>

            {consultaForm.priceId && (
              <div className="space-y-2">
                <Label htmlFor="consultaVariant">Variante (Opcional)</Label>
                <select
                  id="consultaVariant"
                  value={consultaForm.variantId}
                  onChange={(e) =>
                    setConsultaForm({ ...consultaForm, variantId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
                >
                  <option value="">Sin variante (usar precio base)</option>
                  {prices
                    .find((p) => p.id === consultaForm.priceId)
                    ?.variants?.filter((v) => v.isActive)
                    .map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} - L {variant.price.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Mostrar configuración actual si existe */}
            {consultaEspecialidades.find(
              (ce) => ce.specialtyId === selectedSpecialtyForConsulta
            ) && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Configuración actual:</strong>{" "}
                  {
                    consultaEspecialidades.find(
                      (ce) => ce.specialtyId === selectedSpecialtyForConsulta
                    )?.serviceItem.name
                  }
                  {consultaEspecialidades.find(
                    (ce) => ce.specialtyId === selectedSpecialtyForConsulta
                  )?.variant && (
                    <>
                      {" - "}
                      {
                        consultaEspecialidades.find(
                          (ce) => ce.specialtyId === selectedSpecialtyForConsulta
                        )?.variant?.name
                      }
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            {consultaEspecialidades.find(
              (ce) => ce.specialtyId === selectedSpecialtyForConsulta
            ) && (
              <Button
                onClick={() => {
                  const config = consultaEspecialidades.find(
                    (ce) => ce.specialtyId === selectedSpecialtyForConsulta
                  );
                  if (config) {
                    handleDeleteConsulta(config.id);
                    setIsConsultaModalOpen(false);
                  }
                }}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                disabled={saving}
              >
                <Trash2 size={16} className="mr-1" />
                Eliminar
              </Button>
            )}
            <Button
              onClick={() => setIsConsultaModalOpen(false)}
              variant="outline"
              disabled={saving}
            >
              <X size={16} className="mr-1" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveConsulta}
              disabled={saving}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {saving ? (
                <InlineSpinner size="sm" className="mr-2" />
              ) : (
                <Save size={16} className="mr-1" />
              )}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE SUBIDA DE PDF SAR */}
      <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Cargar Autorización SAR
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <PdfUploadDropzone 
              onUploadSuccess={() => {
                loadData();
                setIsPdfModalOpen(false);
              }} 
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE CONFIRMACIÓN */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}

