// Tipos para gestión de servicios
export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  isActive: boolean;
}

export interface PriceSchedule {
  id: string;
  serviceId: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  price: number;
  type: string;
}
