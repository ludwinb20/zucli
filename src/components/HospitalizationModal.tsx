"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { InlineSpinner } from "@/components/ui/spinner";
import { PatientSearch } from "@/components/common/PatientSearch";
import { PatientModal } from "@/components/PatientModal";
import { HospitalizationModalProps, Room } from "@/types/hospitalization";
import { useAuth } from "@/contexts/AuthContext";
import { Save, X } from "lucide-react";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  identityNumber: string;
}

interface Surgery {
  id: string;
  createdAt: string | Date;
  status: string;
  surgeryItem?: {
    id: string;
    name: string;
  } | null;
  transactionItemName?: string | null;
}

interface MedicoSalaUser {
  id: string;
  name: string;
  username: string;
}

interface ServiceItem {
  id: string;
  name: string;
  basePrice: number;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    isActive: boolean;
  }>;
}

interface DailyRateConfig {
  itemId: string;
  item?: ServiceItem;
}

export default function HospitalizationModal({
  isOpen,
  onClose,
  onSave,
  hospitalization,
}: HospitalizationModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicoSalaUsers, setMedicoSalaUsers] = useState<MedicoSalaUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>([]);
  const [dailyRateItem, setDailyRateItem] = useState<ServiceItem | null>(null);

  const [formData, setFormData] = useState({
    patientId: "",
    medicoSalaUserId: "",
    roomId: "",
    surgeryId: "",
    dailyRateItemId: "",
    dailyRateVariantId: "",
    diagnosis: "",
    notes: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (hospitalization) {
        setFormData({
          patientId: hospitalization.patientId,
          medicoSalaUserId: hospitalization.medicoSalaUserId || "",
          roomId: hospitalization.roomId || "",
          surgeryId: "",
          dailyRateItemId: hospitalization.dailyRateItemId || "",
          dailyRateVariantId: hospitalization.dailyRateVariant?.id || "",
          diagnosis: hospitalization.diagnosis || "",
          notes: hospitalization.notes || "",
        });
      } else {
        // Si el usuario es medico_sala, usar su ID automáticamente
        const initialMedicoSalaUserId = user?.role?.name === 'medico_sala' ? (user?.id || "") : "";
        
        setFormData({
          patientId: "",
          medicoSalaUserId: initialMedicoSalaUserId,
          roomId: "",
          surgeryId: "",
          dailyRateItemId: "",
          dailyRateVariantId: "",
          diagnosis: "",
          notes: "",
        });
      }
    }
  }, [isOpen, hospitalization, user]);

  // Cargar cirugías cuando cambie el paciente
  useEffect(() => {
    const loadSurgeries = async () => {
      if (formData.patientId && isOpen) {
        try {
          const surgeriesRes = await fetch(`/api/surgeries?patientId=${formData.patientId}&status=iniciada`);
          if (surgeriesRes.ok) {
            const surgeriesData = await surgeriesRes.json();
            setSurgeries(surgeriesData.surgeries || []);
          }
        } catch (error) {
          console.error("Error loading surgeries:", error);
        }
      } else {
        setSurgeries([]);
      }
    };
    loadSurgeries();
  }, [formData.patientId, isOpen]);

  const loadData = async () => {
    try {
      // Cargar pacientes
      const patientsRes = await fetch("/api/patients?limit=1000");
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData.patients || []);
      }

      // Cargar usuarios con rol medico_sala (solo si el usuario es recepcion)
      if (user?.role?.name === 'recepcion') {
        const usersRes = await fetch("/api/users?role=medico_sala");
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setMedicoSalaUsers(usersData.users || []);
        }
      }

      // Cargar habitaciones disponibles
      const roomsRes = await fetch("/api/rooms");
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      }

      // Cargar configuración del item diario de hospitalización
      const configRes = await fetch("/api/config?key=hospitalization_daily_rate");
      if (configRes.ok) {
        const configData = await configRes.json();
        const itemId = configData.value?.itemId;

        if (itemId) {
          // Cargar el item configurado con sus variantes
          const itemRes = await fetch(`/api/prices?limit=1000`);
          if (itemRes.ok) {
            const itemsData = await itemRes.json();
            const item = itemsData.prices?.find((p: ServiceItem) => p.id === itemId);
            if (item) {
              setDailyRateItem(item);
              setFormData(prev => ({ ...prev, dailyRateItemId: item.id }));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.patientId) {
      toast({
        title: "Error",
        description: "Selecciona un paciente",
        variant: "error",
      });
      return;
    }

    // Validar médico de sala (solo si no es medico_sala, porque su ID ya está asignado)
    if (user?.role?.name !== 'medico_sala' && !formData.medicoSalaUserId) {
      toast({
        title: "Error",
        description: "Selecciona un médico de sala responsable",
        variant: "error",
      });
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/hospitalizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          medicoSalaUserId: formData.medicoSalaUserId || null,
          roomId: formData.roomId || null,
          surgeryId: formData.surgeryId || null,
          dailyRateItemId: formData.dailyRateItemId || null,
          dailyRateVariantId: formData.dailyRateVariantId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al crear hospitalización");
      }

      const newHospitalization = await response.json();

      toast({
        title: "Éxito",
        description: "Hospitalización creada exitosamente",
      });

      await onSave(newHospitalization);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear hospitalización",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handler para crear paciente
  const handlePatientCreated = async (data: unknown) => {
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al crear paciente");

      const newPatient = await response.json();
      
      // Seleccionar automáticamente el nuevo paciente
      setFormData(prev => ({
        ...prev,
        patientId: newPatient.id
      }));
      
      // Cerrar el modal de paciente
      setIsPatientModalOpen(false);
      
      // Cargar cirugías del nuevo paciente si es necesario
      loadSurgeries(newPatient.id);
      
      // Mostrar toast de éxito
      toast({
        title: "Paciente creado",
        description: "El paciente ha sido agregado exitosamente"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el paciente",
        variant: "error",
      });
      throw error;
    }
  };

  // Función helper para cargar cirugías de un paciente
  const loadSurgeries = async (patientId: string) => {
    try {
      const surgeriesRes = await fetch(`/api/surgeries?patientId=${patientId}&status=iniciada`);
      if (surgeriesRes.ok) {
        const surgeriesData = await surgeriesRes.json();
        setSurgeries(surgeriesData.surgeries || []);
      }
    } catch (error) {
      console.error("Error loading surgeries:", error);
    }
  };

  const availableRooms = rooms.filter((r) => r.status === "available");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Nueva Hospitalización
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Paciente */}
          <div className="space-y-2">
            <PatientSearch
              value={formData.patientId}
              onChange={(value) => setFormData({ ...formData, patientId: value })}
              placeholder="Buscar paciente..."
              label="Paciente *"
              onAddNewPatient={() => setIsPatientModalOpen(true)}
            />
          </div>

          {/* Médico de Sala */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Médico de Sala Responsable *</Label>
            {user?.role?.name === 'medico_sala' ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 mt-1">Se usará tu usuario automáticamente como médico responsable</p>
              </div>
            ) : (
              <>
                <select
                  value={formData.medicoSalaUserId}
                  onChange={(e) => setFormData({ ...formData, medicoSalaUserId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
                >
                  <option value="">Seleccionar médico de sala...</option>
                  {medicoSalaUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.username})
                    </option>
                  ))}
                </select>
                {medicoSalaUsers.length === 0 && user?.role?.name === 'recepcion' && (
                  <p className="text-xs text-amber-600">
                    No hay usuarios con rol médico de sala registrados. Contacte al administrador.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Habitación */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Habitación</Label>
            <select
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
            >
              <option value="">Sin asignar</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Habitación {r.number}
                </option>
              ))}
            </select>
            {availableRooms.length === 0 && (
              <p className="text-xs text-amber-600">No hay habitaciones disponibles</p>
            )}
          </div>

          {/* Cirugía Relacionada (Opcional) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Cirugía Relacionada (Opcional)</Label>
            <select
              value={formData.surgeryId}
              onChange={(e) => setFormData({ ...formData, surgeryId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
              disabled={!formData.patientId}
            >
              <option value="">Sin cirugía relacionada</option>
              {surgeries.map((s) => {
                const surgeryName = s.transactionItemName || s.surgeryItem?.name || 'Cirugía sin nombre';
                return (
                  <option key={s.id} value={s.id}>
                    {surgeryName} - {new Date(s.createdAt).toLocaleDateString("es-HN")}
                  </option>
                );
              })}
            </select>
            {surgeries.length === 0 && formData.patientId && (
              <p className="text-xs text-gray-500">No hay cirugías iniciadas para este paciente</p>
            )}
            {formData.surgeryId && (
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                ℹ️ Esta hospitalización se vinculará con la cirugía. El pago se consolidará con la cirugía.
              </p>
            )}
          </div>

          {/* Servicio de cobro diario - Información */}
          {dailyRateItem && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Servicio de Cobro Diario</Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{dailyRateItem.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Precio base: L{dailyRateItem.basePrice.toFixed(2)} por día
                </p>
              </div>
            </div>
          )}

          {/* Variante del servicio diario (solo si el item tiene variantes) */}
          {dailyRateItem && dailyRateItem.variants && dailyRateItem.variants.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Variante del Servicio</Label>
              <select
                value={formData.dailyRateVariantId}
                onChange={(e) => setFormData({ ...formData, dailyRateVariantId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E9589]"
              >
                <option value="">Usar precio base (L{dailyRateItem.basePrice.toFixed(2)})</option>
                {dailyRateItem.variants.filter(v => v.isActive).map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} - L{variant.price.toFixed(2)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Las variantes permiten ajustar el precio según el tipo de habitación o condiciones especiales
              </p>
            </div>
          )}

          {!dailyRateItem && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Advertencia:</strong> No se ha configurado un servicio de cobro diario en el panel de administrador.
                La hospitalización se creará sin cobro automático.
              </p>
            </div>
          )}

          {/* Diagnóstico */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Diagnóstico</Label>
            <Textarea
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Diagnóstico inicial..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
          >
            {saving ? (
              <InlineSpinner className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Crear Hospitalización
          </Button>
        </div>
      </DialogContent>

      {/* Modal anidado para crear paciente */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patient={null}
        onSave={handlePatientCreated}
      />
    </Dialog>
  );
}

