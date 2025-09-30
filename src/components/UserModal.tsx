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
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  username: string;
  email: string | null;
  name: string;
  isActive: boolean;
  role: Role;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSuccess: () => void;
}

export function UserModal({ isOpen, onClose, user, onSuccess }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    roleId: "",
    isActive: true,
  });
  const [roles, setRoles] = useState<Role[]>([]);
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

  // Inicializar formulario
  useEffect(() => {
    if (isOpen) {
      fetchRoles();
      if (user) {
        setFormData({
          username: user.username,
          email: user.email || "",
          password: "",
          name: user.name,
          roleId: user.role.id,
          isActive: user.isActive,
        });
      } else {
        setFormData({
          username: "",
          email: "",
          password: "",
          name: "",
          roleId: "",
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

    if (!isEditing && !formData.password) {
      newErrors.password = "La contraseña es requerida";
    }

    if (!isEditing && formData.password && formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El email no es válido";
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
        email: string | null;
        name: string;
        roleId: string;
        isActive: boolean;
        password?: string;
      } = {
        username: formData.username,
        email: formData.email || null,
        name: formData.name,
        roleId: formData.roleId,
        isActive: formData.isActive,
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
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        if (error.error) {
          // Mostrar error específico del servidor
          setErrors({ general: error.error });
        }
      }
    } catch (error) {
      console.error("Error saving user:", error);
      setErrors({ general: "Error al guardar el usuario" });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuario" : "Crear Nuevo Usuario"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="Ingrese el nombre de usuario"
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
              placeholder="Ingrese el nombre completo"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-red-600 text-sm">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="Ingrese el email (opcional)"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-red-600 text-sm">{errors.email}</p>
            )}
          </div>

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
                  : "Ingrese la contraseña"
              }
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-red-600 text-sm">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol *</Label>
            {loadingRoles ? (
              <div className="flex items-center justify-center p-2">
                <LoadingSpinner />
              </div>
            ) : (
              <Select
                value={formData.roleId}
                onValueChange={(value) => handleInputChange("roleId", value)}
              >
                <SelectTrigger className={errors.roleId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {getRoleDisplayName(role.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.roleId && (
              <p className="text-red-600 text-sm">{errors.roleId}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                handleInputChange("isActive", checked as boolean)
              }
            />
            <Label htmlFor="isActive">Usuario activo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner />
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
