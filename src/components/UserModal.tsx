"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { InlineSpinner } from "@/components/ui/spinner";
import { medicalToasts } from "@/lib/toast";

import { UserRole, UserModalProps } from "@/types/users";
import { Specialty } from "@/types/appointments";

export function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    roleId: "",
    specialtyId: "",
    isActive: true,
  });
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEditing = !!user;

  // Cargar roles
  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await fetch("/api/roles");
      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Cargar especialidades
  const fetchSpecialties = async () => {
    try {
      const response = await fetch("/api/specialties");
      if (response.ok) {
        const data = await response.json();
        setSpecialties(data);
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
    }
  };

  // Inicializar formulario
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
      fetchSpecialties();
      if (user) {
        setFormData({
          username: user.username,
          password: "",
          name: user.name,
          roleId: user.role.id,
          specialtyId: user.specialty?.id || "",
          isActive: user.isActive,
        });
      } else {
        setFormData({
          username: "",
          password: "",
          name: "",
          roleId: "",
          specialtyId: "",
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es requerido";
    }

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.roleId) {
      newErrors.roleId = "El rol es requerido";
    }

    // Validar especialidad solo si el rol es especialista
    if (isSpecialistRole() && !formData.specialtyId) {
      newErrors.specialtyId = "La especialidad es requerida para especialistas";
    }

    if (!isEditing && !formData.password) {
      newErrors.password = "La contraseña es requerida";
    }

    if (!isEditing && formData.password && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const url = isEditing ? `/api/users/${user.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const body: {
        username: string;
        name: string;
        roleId: string;
        isActive: boolean;
        password?: string;
        specialtyId?: string;
      } = {
        username: formData.username,
        name: formData.name,
        roleId: formData.roleId,
        isActive: formData.isActive,
        specialtyId: formData.specialtyId,
      };

      // Solo incluir password si no estamos editando o si se proporcionó una nueva
      if (!isEditing || formData.password) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        // Mostrar toast de éxito
        if (isEditing) {
          medicalToasts.userUpdated(formData.name);
        } else {
          medicalToasts.userCreated(formData.name);
        }
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        if (error.error) {
          // Mostrar error específico del servidor
          setErrors({ general: error.error });
          if (error.error.includes("nombre de usuario")) {
            medicalToasts.duplicateError("nombre de usuario");
          } else {
            medicalToasts.userError(isEditing ? 'actualizar' : 'crear');
          }
        }
      }
    } catch (error) {
      console.error("Error saving user:", error);
      setErrors({ general: "Error al guardar el usuario" });
      medicalToasts.networkError();
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (roleName: string) => {
    const roleNames: { [key: string]: string } = {
      admin: "Administrador",
      especialista: "Especialista",
      recepcion: "Recepción",
      caja: "Caja",
    };
    return roleNames[roleName] || roleName;
  };

  // Verificar si el rol seleccionado es especialista
  const isSpecialistRole = () => {
    const selectedRole = roles.find(role => role.id === formData.roleId);
    return selectedRole?.name === 'especialista';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {errors.general}
            </div>
          )}

          {/* Primera fila: Username y Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Ej: jperez, maria.garcia, admin01"
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-red-600 text-sm">{errors.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ej: Juan Pérez, María García, Dr. López"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-red-600 text-sm">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Segunda fila: Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {isEditing ? "Nueva Contraseña (opcional)" : "Contraseña *"}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder={
                isEditing
                  ? "Dejar vacío para mantener la actual"
                  : "Ej: MiPassword123, Admin2024, Segura456"
              }
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password}</p>
            )}
          </div>

          {/* Tercera fila: Role y Active Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Rol *</Label>
              <Select
                value={formData.roleId}
                onValueChange={(value) => handleInputChange("roleId", value)}
                disabled={loadingRoles}
              >
                <SelectTrigger className={errors.roleId ? "border-red-500" : ""}>
                  <SelectValue placeholder={loadingRoles ? "Cargando roles..." : "Seleccione un rol"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingRoles ? (
                    <div className="flex items-center justify-center p-2 text-gray-500">
                      Cargando roles...
                    </div>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {getRoleDisplayName(role.name)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.roleId && (
                <p className="text-red-600 text-sm">{errors.roleId}</p>
              )}
            </div>

            {/* Selector de Especialidad - Solo visible para especialistas */}
            {isSpecialistRole() && (
              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidad *</Label>
                <Select
                  value={formData.specialtyId}
                  onValueChange={(value) => handleInputChange("specialtyId", value)}
                >
                  <SelectTrigger className={errors.specialtyId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Seleccione una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.specialtyId && (
                  <p className="text-red-600 text-sm">{errors.specialtyId}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Estado del Usuario</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    handleInputChange("isActive", checked as boolean)
                  }
                />
                <Label htmlFor="isActive" className="text-sm text-gray-600">Usuario activo</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-[#2E9589] hover:bg-[#2E9589]/90 text-white"
            >
              {loading ? (
                <>
                  <InlineSpinner size="sm" />
                  <span className="ml-2">Guardando...</span>
                </>
              ) : (
                <span>{isEditing ? "Actualizar" : "Crear"}</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
