/**
 * Utilidades para manejo de fechas con timezone de Honduras
 * Simplificamos usando timestamps estándar de JavaScript
 */

/**
 * Convierte una fecha string (YYYY-MM-DD) al timestamp estándar
 * La fecha se maneja como medianoche en timezone local
 */
export function dateStringToHondurasTimestamp(dateString: string): number {
  // Crear fecha en timezone local (medianoche)
  const date = new Date(dateString + 'T00:00:00');
  return date.getTime();
}

/**
 * Convierte un timestamp a string formateado (DD/MM/YYYY) en timezone de Honduras
 */
export function timestampToHondurasDateString(timestamp: number): string {
  const date = new Date(timestamp);
  
  return date.toLocaleDateString('es-HN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Tegucigalpa'
  });
}

/**
 * Calcula la edad basada en un timestamp de fecha de nacimiento
 */
export function calculateAgeFromTimestamp(birthTimestamp: number): number {
  const now = new Date();
  const birthDate = new Date(birthTimestamp);
  
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
}

/**
 * Formatea un timestamp para la respuesta de API (YYYY-MM-DD)
 */
export function formatBirthDateForAPI(timestamp: number): string {
  const date = new Date(timestamp);
  
  // Retornar en formato YYYY-MM-DD para el frontend
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el timestamp actual
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}