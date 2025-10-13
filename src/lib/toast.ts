import { toast } from "@/hooks/use-toast";

// Helper functions para mostrar toasts con la paleta de colores del sistema
export const showToast = {
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "success",
    });
  },

  error: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "error",
    });
  },

  warning: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "warning",
    });
  },

  info: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "info",
    });
  },

  default: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "default",
    });
  },
};

// Toasts específicos para el sistema médico
export const medicalToasts = {
  // Pacientes
  patientCreated: (name: string) => {
    showToast.success(
      "Paciente registrado",
      `${name} ha sido registrado exitosamente en el sistema.`
    );
  },

  patientUpdated: (name: string) => {
    showToast.success(
      "Paciente actualizado",
      `Los datos de ${name} han sido actualizados correctamente.`
    );
  },

  patientDeleted: (name: string) => {
    showToast.success(
      "Paciente eliminado",
      `${name} ha sido eliminado del sistema.`
    );
  },

  patientError: (action: string) => {
    showToast.error(
      "Error en paciente",
      `No se pudo ${action} el paciente. Inténtalo de nuevo.`
    );
  },

  // Usuarios
  userCreated: (name: string) => {
    showToast.success(
      "Usuario creado",
      `${name} ha sido registrado exitosamente en el sistema.`
    );
  },

  userUpdated: (name: string) => {
    showToast.success(
      "Usuario actualizado",
      `Los datos de ${name} han sido actualizados correctamente.`
    );
  },

  userDeleted: (name: string) => {
    showToast.success(
      "Usuario eliminado",
      `${name} ha sido eliminado del sistema.`
    );
  },

  userError: (action: string) => {
    showToast.error(
      "Error en usuario",
      `No se pudo ${action} el usuario. Inténtalo de nuevo.`
    );
  },

  // Autenticación
  loginSuccess: (name: string) => {
    showToast.success(
      "Bienvenido",
      `Hola ${name}, has iniciado sesión correctamente.`
    );
  },

  loginError: () => {
    showToast.error(
      "Error de autenticación",
      "Usuario o contraseña incorrectos. Verifica tus credenciales."
    );
  },

  logoutSuccess: () => {
    showToast.info(
      "Sesión cerrada",
      "Has cerrado sesión exitosamente."
    );
  },

  // Validaciones
  validationError: (field: string) => {
    showToast.warning(
      "Campo requerido",
      `Por favor, completa el campo: ${field}`
    );
  },

  duplicateError: (item: string) => {
    showToast.error(
      "Dato duplicado",
      `El ${item} ya existe en el sistema.`
    );
  },

  // Sistema
  systemError: () => {
    showToast.error(
      "Error del sistema",
      "Ha ocurrido un error inesperado. Contacta al administrador."
    );
  },

  networkError: () => {
    showToast.error(
      "Error de conexión",
      "No se pudo conectar con el servidor. Verifica tu conexión a internet."
    );
  },

  // Información general
  saveSuccess: (item: string) => {
    showToast.success(
      "Guardado exitoso",
      `${item} ha sido guardado correctamente.`
    );
  },

  deleteConfirm: (item: string) => {
    showToast.warning(
      "Confirmación requerida",
      `¿Estás seguro de que deseas eliminar ${item}?`
    );
  },

  // Permisos
  accessDenied: () => {
    showToast.error(
      "Acceso denegado",
      "No tienes permisos para realizar esta acción."
    );
  },

  // Carga
  loading: (action: string) => {
    showToast.info(
      "Procesando",
      `${action} en progreso...`
    );
  },
};
