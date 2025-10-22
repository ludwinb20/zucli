"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  PriceWithRelations,
  Tag,
  PriceSpecialty,
  CreatePriceData,
} from "@/types/prices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Package,
  Stethoscope,
  X,
  Save,
  Search,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InlineSpinner } from "@/components/ui/spinner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { VariantsModal } from "@/components/VariantsModal";

export default function AdminPricesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prices, setPrices] = useState<PriceWithRelations[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [specialties, setSpecialties] = useState<PriceSpecialty[]>([]);
  
  // Estados de búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

  // Modal de crear/editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<PriceWithRelations | null>(
    null
  );
  
  // Modal de variantes
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);
  const [selectedPriceForVariants, setSelectedPriceForVariants] = useState<PriceWithRelations | null>(null);
  
  // Diálogo de confirmación
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

  // Formulario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "servicio" as "medicamento" | "servicio",
    basePrice: "",
    selectedTags: [] as string[],
    selectedSpecialties: [] as string[],
  });

  // Verificar permisos
  useEffect(() => {
    if (user && user.role?.name !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const loadPrices = useCallback(async () => {
    try {
      setLoading(true);

      // Construir URL con parámetros de búsqueda y filtros
      const params = new URLSearchParams();
      params.append('limit', '100');
      params.append('isActive', 'true');

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      if (tagFilter !== 'all') {
        const selectedTag = tags.find(t => t.id === tagFilter);
        if (selectedTag) {
          params.append('tag', selectedTag.name);
        }
      }

      if (specialtyFilter !== 'all') {
        params.append('specialtyId', specialtyFilter);
      }

      const pricesRes = await fetch(`/api/prices?${params.toString()}`);
      if (pricesRes.ok) {
        const pricesData = await pricesRes.json();
        setPrices(pricesData.prices || []);
      }
    } catch (error) {
      console.error("Error loading prices:", error);
      toast({
        title: "Error",
        description: "Error al cargar los precios",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, tagFilter, specialtyFilter, tags]); // Removido toast

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (user?.role?.name !== "admin") return;
      
      try {
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
        console.error("Error loading initial data:", error);
        toast({
          title: "Error",
          description: "Error al cargar los datos",
          variant: "error",
        });
      }
    };

    loadInitialData();
  }, [user, toast]); // Solo se ejecuta una vez al montar y cuando cambia user

  // Recargar precios cuando cambien los filtros (con debounce para búsqueda)
  useEffect(() => {
    if (user?.role?.name === "admin" && tags.length > 0) {
      const timeoutId = setTimeout(() => {
        loadPrices();
      }, searchTerm ? 500 : 0); // Debounce de 500ms solo para búsqueda

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, typeFilter, tagFilter, specialtyFilter, user, tags.length]);

  const openCreateModal = () => {
    setEditingPrice(null);
    setFormData({
      name: "",
      description: "",
      type: "servicio",
      basePrice: "",
      selectedTags: [],
      selectedSpecialties: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (price: PriceWithRelations) => {
    setEditingPrice(price);
    setFormData({
      name: price.name,
      description: price.description || "",
      type: price.type as "medicamento" | "servicio",
      basePrice: price.basePrice.toString(),
      selectedTags: price.tags.map((t) => t.id),
      selectedSpecialties: price.specialties.map((s) => s.id),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPrice(null);
    setFormData({
      name: "",
      description: "",
      type: "servicio",
      basePrice: "",
      selectedTags: [],
      selectedSpecialties: [],
    });
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "error",
      });
      return;
    }

    if (!formData.basePrice || parseFloat(formData.basePrice) < 0) {
      toast({
        title: "Error",
        description: "El precio base debe ser un número positivo",
        variant: "error",
      });
      return;
    }

    setSaving(true);

    try {
      const data: CreatePriceData = {
        name: formData.name,
        description: formData.description || undefined,
        type: formData.type,
        basePrice: parseFloat(formData.basePrice),
        tagIds: formData.selectedTags,
        specialtyIds:
          formData.selectedSpecialties.length > 0
            ? formData.selectedSpecialties
            : undefined,
      };

      if (editingPrice) {
        // Actualizar
        const res = await fetch(`/api/prices/${editingPrice.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Error al actualizar");

        toast({
          title: "Éxito",
          description: "Precio actualizado exitosamente",
          variant: "success",
        });
      } else {
        // Crear
        const res = await fetch("/api/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Error al crear");

        toast({
          title: "Éxito",
          description: "Precio creado exitosamente",
          variant: "success",
        });
      }

      closeModal();
      loadPrices();
    } catch (error) {
      console.error("Error saving price:", error);
      toast({
        title: "Error",
        description: editingPrice
          ? "Error al actualizar el precio"
          : "Error al crear el precio",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (priceId: string, priceName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Eliminar Precio",
      description: `¿Está seguro de eliminar "${priceName}"? Esta acción no se puede deshacer.`,
      onConfirm: () => deletePrice(priceId),
    });
  };

  const deletePrice = async (priceId: string) => {
    try {
      const res = await fetch(`/api/prices/${priceId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      toast({
        title: "Éxito",
        description: "Precio eliminado exitosamente",
        variant: "success",
      });

      loadPrices();
    } catch (error) {
      console.error("Error deleting price:", error);
      toast({
        title: "Error",
        description: "Error al eliminar el precio",
        variant: "error",
      });
    }
  };

  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter((id) => id !== tagId)
        : [...prev.selectedTags, tagId],
    }));
  };

  const toggleSpecialty = (specialtyId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSpecialties: prev.selectedSpecialties.includes(specialtyId)
        ? prev.selectedSpecialties.filter((id) => id !== specialtyId)
        : [...prev.selectedSpecialties, specialtyId],
    }));
  };

  const openVariantsModal = (price: PriceWithRelations) => {
    setSelectedPriceForVariants(price);
    setIsVariantsModalOpen(true);
  };

  const closeVariantsModal = () => {
    setIsVariantsModalOpen(false);
    setSelectedPriceForVariants(null);
  };

  // No renderizar si no es admin
  if (user?.role?.name !== "admin") {
    return null;
  }

  const hasEspecialidadTag = formData.selectedTags.some(
    (tagId) => tags.find((t) => t.id === tagId)?.name === "especialidad"
  );

  return (
    
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Lista de Precios */}
      <Card className="bg-transparent border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Administración de Prodcutos y Servicios ({prices.length})
            </CardTitle>
            <Button
              onClick={openCreateModal}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto/Servicio
            </Button>
          </div>
        </CardHeader>

        {/* Barra de búsqueda y filtros */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>

            {/* Filtro por Tipo */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:border-[#2E9589]"
              >
                <option value="all">Todos los tipos</option>
                <option value="medicamento">Medicamentos</option>
                <option value="servicio">Servicios</option>
              </select>
            </div>

            {/* Filtro por Tag */}
            <div>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:border-[#2E9589]"
              >
                <option value="all">Todas las categorías</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {(tag.name[0].toUpperCase() + tag.name.slice(1)).replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Especialidad */}
            <div>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2E9589] focus:border-[#2E9589]"
              >
                <option value="all">Todas las especialidades</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contador de resultados y botón limpiar filtros */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              {loading ? (
                <> </>
              ) : (
                <span>
                  Mostrando <strong>{prices.length}</strong> producto{prices.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
            
            {(searchTerm || typeFilter !== 'all' || tagFilter !== 'all' || specialtyFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setTagFilter("all");
                  setSpecialtyFilter("all");
                }}
                className="text-gray-600"
              >
                <X size={14} className="mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <InlineSpinner size="lg" />
            </div>
          ) : prices.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm || typeFilter !== 'all' || tagFilter !== 'all' || specialtyFilter !== 'all' ? (
                <>
                  <Filter size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">
                    No se encontraron resultados
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Intenta ajustar los filtros o búsqueda
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setTypeFilter("all");
                      setTagFilter("all");
                      setSpecialtyFilter("all");
                    }}
                    className="mt-4"
                  >
                    <X size={14} className="mr-1" />
                    Limpiar filtros
                  </Button>
                </>
              ) : (
                <>
                  <DollarSign size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">
                    No hay precios configurados
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Crea tu primer precio usando el botón &quot;Nuevo Precio&quot;
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prices.map((price) => (
                <Card
                  key={price.id}
                  className="hover:shadow-md transition-shadow border-gray-200"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {price.type === "medicamento" ? (
                            <Package size={16} className="text-gray-500" />
                          ) : (
                            <Stethoscope size={16} className="text-[#2E9589]" />
                          )}
                          <h4 className="font-medium text-gray-900">
                            {price.name}
                          </h4>
                        </div>
                        {price.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {price.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {price.tags.map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {(tag.name[0].toUpperCase() + tag.name.slice(1)).replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                        {price.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {price.specialties.map((specialty) => (
                              <Badge
                                key={specialty.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {specialty.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-bold text-[#2E9589] text-lg">
                          L. {price.basePrice.toFixed(2)}
                        </p>
                        <Badge
                          variant={price.isActive ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {price.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>

                    {price.variants.length > 0 && (
                      <div className="mb-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-gray-600 font-medium">Variantes:</p>
                        </div>
                        {price.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="text-xs text-gray-700 flex justify-between items-center py-1"
                          >
                            <span>{variant.name}</span>
                            <span className="font-medium">
                              L. {variant.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openVariantsModal(price)}
                        className="w-full border-[#2E9589] text-[#2E9589] hover:bg-[#2E9589]/10"
                      >
                        <DollarSign className="h-3 w-3 mr-1" />
                        Gestionar Variantes ({price.variants.length})
                      </Button>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(price)}
                          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(price.id, price.name)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Crear/Editar */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 flex flex-col">
          {/* Header fijo */}
          <DialogHeader className="p-6 flex-shrink-0 border-b border-gray-200 bg-white">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingPrice ? "Editar Precio" : "Nuevo Precio"}
            </DialogTitle>
          </DialogHeader>

          {/* Contenido scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Tipo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Tipo *
              </Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value as "medicamento" | "servicio",
                  }))
                }
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="servicio" id="servicio" />
                  <Label
                    htmlFor="servicio"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Servicio
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medicamento" id="medicamento" />
                  <Label
                    htmlFor="medicamento"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Medicamento
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Nombre *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ej: Consulta Externa"
                className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Descripción
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descripción del medicamento/servicio"
                rows={2}
                className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>

            {/* Precio Base */}
            <div className="space-y-2">
              <Label
                htmlFor="basePrice"
                className="text-sm font-medium text-gray-700"
              >
                Precio Base (L.) *
              </Label>
              <Input
                id="basePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    basePrice: e.target.value,
                  }))
                }
                placeholder="800.00"
                className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Categorías (Tags)
              </Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={
                      formData.selectedTags.includes(tag.id)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer hover:bg-[#2E9589]/10"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {(tag.name[0].toUpperCase() + tag.name.slice(1)).replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Especialidades (solo si tiene tag "especialidad") */}
            {hasEspecialidadTag && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Especialidades
                </Label>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <Badge
                      key={specialty.id}
                      variant={
                        formData.selectedSpecialties.includes(specialty.id)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer hover:bg-[#2E9589]/10"
                      onClick={() => toggleSpecialty(specialty.id)}
                    >
                      {specialty.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer fijo */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={saving}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {saving ? (
                <>
                  <InlineSpinner size="sm" className="mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingPrice ? "Guardar Cambios" : "Crear Precio"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Variantes */}
      {selectedPriceForVariants && (
        <VariantsModal
          isOpen={isVariantsModalOpen}
          onClose={closeVariantsModal}
          price={selectedPriceForVariants}
          onSuccess={loadPrices}
        />
      )}

      {/* Diálogo de Confirmación */}
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
