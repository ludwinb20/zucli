// Mock data factories for testing

export const mockPatient = {
  id: 'patient-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  birthDate: '1990-01-15',
  gender: 'Masculino',
  identityNumber: '0801-1990-12345',
  phone: '9876-5432',
  address: 'Tegucigalpa, Honduras',
  emergencyContactName: 'María Pérez',
  emergencyContactNumber: '9876-5433',
  emergencyContactRelation: 'Madre',
  medicalHistory: null,
  allergies: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockSpecialty = {
  id: 'specialty-1',
  name: 'Medicina General',
  description: 'Consulta general',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockAppointment = {
  id: 'appointment-1',
  patientId: mockPatient.id,
  specialtyId: mockSpecialty.id,
  appointmentDate: new Date('2024-12-25T10:00:00'),
  status: 'pendiente' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  specialty: mockSpecialty,
};

export const mockUser = {
  id: 'user-1',
  username: 'admin',
  name: 'Administrator',
  roleId: 'role-admin',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  role: {
    id: 'role-admin',
    name: 'admin',
  },
};

export const mockServiceItem = {
  id: 'item-1',
  name: 'Consulta General',
  type: 'servicio' as const,
  basePrice: 250.0,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockPayment = {
  id: 'payment-1',
  consultationId: 'consultation-1',
  saleId: null,
  hospitalizationId: null,
  patientId: mockPatient.id,
  total: 250.0,
  status: 'pendiente' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  createdBy: mockUser.id,
};

export const mockInvoiceRange = {
  id: 'range-1',
  cai: 'ABC123-DEF456-GHI789',
  rangoInicio: '001-001-01-00000001',
  rangoFin: '001-001-01-00001000',
  fechaLimiteEmision: new Date('2025-12-31'),
  currentNumber: 1,
  status: 'activo' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Factory functions for creating variations
export const createMockPatient = (overrides?: Partial<typeof mockPatient>) => ({
  ...mockPatient,
  ...overrides,
});

export const createMockAppointment = (overrides?: Partial<typeof mockAppointment>) => ({
  ...mockAppointment,
  ...overrides,
});

export const createMockUser = (overrides?: Partial<typeof mockUser>) => ({
  ...mockUser,
  ...overrides,
});

export const createMockServiceItem = (overrides?: Partial<typeof mockServiceItem>) => ({
  ...mockServiceItem,
  ...overrides,
});

export const createMockPayment = (overrides?: Partial<typeof mockPayment>) => ({
  ...mockPayment,
  ...overrides,
});

// ============================================
// HOSPITALIZACIONES
// ============================================

export const mockRoom = {
  id: 'room-1',
  number: '101',
  status: 'available' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockSalaDoctor = {
  id: 'sala-doctor-1',
  name: 'Dr. Roberto Martínez',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockHospitalization = {
  id: 'hosp-1',
  patientId: mockPatient.id,
  salaDoctorId: mockSalaDoctor.id,
  roomId: mockRoom.id,
  surgeryId: null,
  dailyRateItemId: mockServiceItem.id,
  dailyRateVariantId: null,
  admissionDate: new Date('2024-01-01'),
  dischargeDate: null,
  diagnosis: 'Observación post-operatoria',
  status: 'iniciada' as const,
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  salaDoctor: mockSalaDoctor,
  room: mockRoom,
  dailyRateItem: mockServiceItem,
  dailyRateVariant: null,
};

export const createMockHospitalization = (overrides?: Partial<typeof mockHospitalization>) => ({
  ...mockHospitalization,
  ...overrides,
});

export const createMockRoom = (overrides?: Partial<typeof mockRoom>) => ({
  ...mockRoom,
  ...overrides,
});

// ============================================
// CIRUGÍAS
// ============================================

export const mockSurgeryItem = {
  id: 'surgery-item-1',
  name: 'Apendicectomía',
  type: 'servicio' as const,
  basePrice: 5000.0,
  isActive: true,
  description: 'Cirugía de apéndice',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockSurgery = {
  id: 'surgery-1',
  patientId: mockPatient.id,
  surgeryItemId: mockSurgeryItem.id,
  status: 'iniciada' as const,
  completedDate: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  surgeryItem: mockSurgeryItem,
};

export const createMockSurgery = (overrides?: Partial<typeof mockSurgery>) => ({
  ...mockSurgery,
  ...overrides,
});

// ============================================
// DOCUMENTOS MÉDICOS
// ============================================

export const mockMedicalDocumentConstancia = {
  id: 'doc-1',
  patientId: mockPatient.id,
  issuedBy: mockUser.id,
  documentType: 'constancia' as const,
  constancia: 'A quien corresponda, certifico que el paciente se encuentra bajo tratamiento médico...',
  diagnostico: null,
  diasReposo: null,
  fechaInicio: null,
  fechaFin: null,
  tipoExamen: null,
  indicaciones: null,
  urgencia: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  issuer: mockUser,
};

export const mockMedicalDocumentIncapacidad = {
  id: 'doc-2',
  patientId: mockPatient.id,
  issuedBy: mockUser.id,
  documentType: 'incapacidad' as const,
  constancia: null,
  diagnostico: 'Faringitis aguda',
  diasReposo: 3,
  fechaInicio: new Date('2024-01-01'),
  fechaFin: new Date('2024-01-04'),
  tipoExamen: null,
  indicaciones: null,
  urgencia: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  issuer: mockUser,
};

export const mockMedicalDocumentOrden = {
  id: 'doc-3',
  patientId: mockPatient.id,
  issuedBy: mockUser.id,
  documentType: 'orden_examen' as const,
  constancia: null,
  diagnostico: null,
  diasReposo: null,
  fechaInicio: null,
  fechaFin: null,
  tipoExamen: 'Radiografía de Tórax',
  indicaciones: 'Descartar neumonía',
  urgencia: 'urgente' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  issuer: mockUser,
};

export const createMockMedicalDocument = (overrides?: Partial<typeof mockMedicalDocumentConstancia>) => ({
  ...mockMedicalDocumentConstancia,
  ...overrides,
});

// ============================================
// REPORTES
// ============================================

export const mockInvoice = {
  id: 'invoice-1',
  paymentId: 'payment-1',
  type: 'simple' as const,
  numeroDocumento: 'REC-000001',
  fechaEmision: new Date('2024-01-01'),
  emisorNombre: 'Hospital Zuniga',
  clienteNombre: 'Juan Pérez',
  clienteIdentidad: '0801-1990-12345',
  clienteRTN: null,
  emisorRTN: null,
  emisorRazonSocial: null,
  subtotal: 217.39,
  descuentos: 0,
  isv: 32.61,
  total: 250.0,
  detalleGenerico: false,
  observaciones: null,
  invoiceRangeId: null,
  correlativo: null,
  cai: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockTransactionItem = {
  id: 'trans-1',
  sourceType: 'consultation' as const,
  sourceId: 'consultation-1',
  serviceItemId: mockServiceItem.id,
  variantId: null,
  quantity: 1,
  nombre: 'Consulta General',
  precioUnitario: 250.0,
  descuento: 0,
  total: 250.0,
  notes: null,
  addedBy: mockUser.id,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  serviceItem: mockServiceItem,
};

export const createMockInvoice = (overrides?: Partial<typeof mockInvoice>) => ({
  ...mockInvoice,
  ...overrides,
});

export const createMockTransactionItem = (overrides?: Partial<typeof mockTransactionItem>) => ({
  ...mockTransactionItem,
  ...overrides,
});

