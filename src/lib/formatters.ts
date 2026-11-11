// Utilidades para formateo de datos consistentes

export const formatDateTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
  }).format(amount);
};

export const formatPhone = (phone: string) => {
  // Formatear número de teléfono hondureño
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
};

export const formatIdentityNumber = (identity: string) => {
  // Formatear número de identidad hondureño
  const cleaned = identity.replace(/\D/g, '');
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 13)}`;
  }
  return identity;
};

export const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Punto de emisión SAR. Conserva ceros a la izquierda: 2 → "002".
 * Un prefijo ya armado ("000-002") se deja igual.
 */
export const formatPuntoEmision = (puntoEmision: string | number | null | undefined) => {
  const raw = String(puntoEmision ?? '').trim();
  if (!raw || raw.includes('-')) return raw;
  if (/^\d+$/.test(raw)) return raw.padStart(3, '0');
  return raw;
};

/**
 * Número fiscal: establecimiento 000 + punto de emisión (3) + tipo 01 + correlativo (8).
 * 2 → "000-002-01-00000015". Si el punto ya trae establecimiento ("000-002"), no se duplica.
 */
export const formatNumeroFacturaLegal = (
  puntoEmision: string | number | null | undefined,
  correlativo: number
) => {
  const punto = formatPuntoEmision(puntoEmision);
  const prefijo = punto.includes('-') ? punto : `000-${punto}`;
  return `${prefijo}-01-${String(correlativo).padStart(8, '0')}`;
};

