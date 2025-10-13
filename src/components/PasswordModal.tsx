"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineSpinner } from "@/components/ui/spinner";
import { Key } from "lucide-react";
import { medicalToasts } from "@/lib/toast";

import { PasswordModalProps } from "@/types/users";

export function PasswordModal({ isOpen, onClose, user }: PasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setSuccess(false);
    onClose();
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!newPassword) {
      newErrors.newPassword = "La nueva contraseña es requerida";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirme la nueva contraseña";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setSuccess(false);

      const response = await fetch(`/api/users/${user.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      if (response.ok) {
        medicalToasts.saveSuccess(`Contraseña de ${user.name}`);
        setSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        setErrors({});
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        const error = await response.json();
        setErrors({ general: error.error || "Error al cambiar la contraseña" });
        medicalToasts.userError('cambiar contraseña');
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setErrors({ general: "Error al cambiar la contraseña" });
      medicalToasts.networkError();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "newPassword") {
      setNewPassword(value);
    } else if (field === "confirmPassword") {
      setConfirmPassword(value);
    }

    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Cambiar Contraseña</span>
          </DialogTitle>
        </DialogHeader>

        {user && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Usuario:</strong> {user.username}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Nombre:</strong> {user.name}
            </p>
          </div>
        )}

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-lg font-semibold mb-2">
              ✓ Contraseña actualizada correctamente
            </div>
            <p className="text-sm text-gray-600">
              Esta ventana se cerrará automáticamente...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => handleInputChange("newPassword", e.target.value)}
                placeholder="Ingrese la nueva contraseña"
                className={errors.newPassword ? "border-red-500" : ""}
                autoComplete="new-password"
              />
              {errors.newPassword && (
                <p className="text-red-600 text-sm">{errors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Confirme la nueva contraseña"
                className={errors.confirmPassword ? "border-red-500" : ""}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <strong>Nota:</strong> La contraseña debe tener al menos 6 caracteres.
              El usuario deberá usar esta nueva contraseña en su próximo inicio de sesión.
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
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
                    <span className="ml-2">Cambiando...</span>
                  </>
                ) : (
                  <span>Cambiar Contraseña</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
