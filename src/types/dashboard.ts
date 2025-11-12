// Tipos para los dashboards por rol

// Admin Dashboard
export interface AdminStats {
  patients: {
    total: number;
    newThisMonth: number;
  };
  appointments: {
    today: {
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
    thisWeek: number;
    last7Days: ChartDataPoint[];
  };
  revenue: {
    today: number;
    thisMonth: number;
  };
  pendingOrders: {
    radiology: number;
    consultations: number;
  };
  activeUsers: {
    byRole: Record<string, number>;
  };
  recentActivity: Array<{
    action: string;
    user: string;
    time: string;
    module: string;
  }>;
}

// Cashier Dashboard
export interface CashierStats {
  payments: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    byMethod: {
      cash: number;
      card: number;
      transfer: number;
    };
    last7Days: ChartDataPoint[];
  };
  invoices: {
    legal: number;
    simple: number;
  };
  recentTransactions: Array<{
    id: string;
    patient: string;
    amount: number;
    date: string;
    status: string;
  }>;
}

// Reception Dashboard
export interface ReceptionStats {
  appointmentsToday: Array<{
    id: string;
    patient: string;
    specialty: string;
    time: string;
    status: string;
  }>;
  patients: {
    total: number;
    newThisMonth: number;
  };
  upcomingAppointments: Array<{
    date: string;
    patient: string;
    specialty: string;
    time: string;
  }>;
  activeHospitalizations: Array<{
    id: string;
    patientId: string;
    patient: string;
    identityNumber: string;
    room: string;
    doctor: string;
    admissionDate: string;
  }>;
}

// Radiologist Dashboard
export interface RadiologistStats {
  orders: {
    pending: number;
    completed: number;
    today: number;
  };
  topStudies: Array<{
    name: string;
    count: number;
  }>;
  recentOrders: Array<{
    id: string;
    patient: string;
    items: string;
    date: string;
    status: string;
  }>;
}

// Specialist Dashboard
export interface SpecialistStats {
  appointmentsToday: Array<{
    id: string;
    patient: string;
    time: string;
    status: string;
  }>;
  appointmentsWeek: Array<{
    date: string;
    patient: string;
    time: string;
    status: string;
  }>;
  consultations: {
    thisMonth: number;
    completed: number;
  };
}

// Chart Data Types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

