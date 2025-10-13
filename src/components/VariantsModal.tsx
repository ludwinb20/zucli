'use client';

import { useState, useEffect, useCallback } from 'react';
import { PriceVariant, PriceWithRelations } from '@/types/prices';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, X, Save, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InlineSpinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface VariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: PriceWithRelations;
  onSuccess: () => void;
}

export function VariantsModal({ isOpen, onClose, price, onSuccess }: VariantsModalProps) {
  const { toast } = useToast();
  const [variants, setVariants] = useState<PriceVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVariant, setEditingVariant] = useState<PriceVariant | null>(null);
  
  // Diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    isActive: true
  });

  const loadVariants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/prices/${price.id}/variants`);
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
      }
    } catch (error) {
      console.error('Error loading variants:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar las variantes',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [price.id, toast]);

  useEffect(() => {
    if (isOpen && price) {
      loadVariants();
    }
  }, [isOpen, price, loadVariants]);

  const openCreateForm = () => {
    setEditingVariant(null);
    setFormData({ name: '', description: '', price: '', isActive: true });
    setIsEditing(true);
  };

  const openEditForm = (variant: PriceVariant) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      description: variant.description || '',
      price: variant.price.toString(),
      isActive: variant.isActive
    });
    setIsEditing(true);
  };

  const closeForm = () => {
    setIsEditing(false);
    setEditingVariant(null);
    setFormData({ name: '', description: '', price: '', isActive: true });
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es requerido',
        variant: 'error'
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      toast({
        title: 'Error',
        description: 'El precio debe ser un número positivo',
        variant: 'error'
      });
      return;
    }

    setSaving(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        isActive: formData.isActive
      };

      if (editingVariant) {
        // Actualizar
        const res = await fetch(`/api/variants/${editingVariant.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Error al actualizar');

        toast({
          title: 'Éxito',
          description: 'Variante actualizada exitosamente',
          variant: 'success'
        });
      } else {
        // Crear
        const res = await fetch(`/api/prices/${price.id}/variants`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error('Error al crear');

        toast({
          title: 'Éxito',
          description: 'Variante creada exitosamente',
          variant: 'success'
        });
      }

      closeForm();
      loadVariants();
      onSuccess();
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: 'Error',
        description: editingVariant ? 'Error al actualizar la variante' : 'Error al crear la variante',
        variant: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (variantId: string, variantName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Eliminar Variante',
      description: `¿Está seguro de eliminar la variante "${variantName}"? Esta acción no se puede deshacer.`,
      onConfirm: () => deleteVariant(variantId),
    });
  };

  const deleteVariant = async (variantId: string) => {
    try {
      const res = await fetch(`/api/variants/${variantId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al eliminar');

      toast({
        title: 'Éxito',
        description: 'Variante eliminada exitosamente',
        variant: 'success'
      });

      loadVariants();
      onSuccess();
    } catch (error) {
      console.error('Error deleting variant:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar la variante',
        variant: 'error'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 flex-shrink-0 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Gestionar Variantes - {price.name}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Precio base: <span className="font-semibold text-[#2E9589]">L. {price.basePrice.toFixed(2)}</span>
          </p>
        </DialogHeader>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <InlineSpinner size="md" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Botón para agregar */}
              {!isEditing && (
                <Button
                  onClick={openCreateForm}
                  className="w-full bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Variante
                </Button>
              )}

              {/* Formulario de crear/editar */}
              {isEditing && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {editingVariant ? 'Editar Variante' : 'Nueva Variante'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeForm}
                      disabled={saving}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="variant-name" className="text-sm font-medium text-gray-700">
                        Nombre *
                      </Label>
                      <Input
                        id="variant-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej: Nocturna, Fin de semana"
                        className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="variant-description" className="text-sm font-medium text-gray-700">
                        Descripción
                      </Label>
                      <Textarea
                        id="variant-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descripción de la variante"
                        rows={2}
                        className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="variant-price" className="text-sm font-medium text-gray-700">
                        Precio (L.) *
                      </Label>
                      <Input
                        id="variant-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="1200.00"
                        className="border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="variant-active"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                      />
                      <Label htmlFor="variant-active" className="text-sm font-normal cursor-pointer">
                        Variante activa
                      </Label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={closeForm}
                        disabled={saving}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
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
                            {editingVariant ? 'Guardar Cambios' : 'Crear Variante'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de variantes */}
              {variants.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <DollarSign size={48} className="text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm font-medium">
                    No hay variantes configuradas
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    Las variantes permiten tener precios diferentes del mismo servicio/producto
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Variantes Existentes ({variants.length})
                  </h3>
                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">{variant.name}</h4>
                          <Badge variant={variant.isActive ? "default" : "destructive"} className="text-xs">
                            {variant.isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        {variant.description && (
                          <p className="text-sm text-gray-600">{variant.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <div className="text-right">
                          <p className="font-bold text-[#2E9589] text-lg">
                            L. {variant.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditForm(variant)}
                            disabled={isEditing}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(variant.id, variant.name)}
                            disabled={isEditing}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>

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
    </Dialog>
  );
}

