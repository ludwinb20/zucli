// Exportar todos los tipos desde un solo lugar
export type { AuthUser, AuthRole, AuthState, ROLES, UserRole as AuthUserRole } from './auth';
export type { User, UserRole, UserModalProps, PasswordModalProps } from './users';
export type { NavigationItem } from './navigation';
export type { Service, PriceSchedule } from './services';
export type { Patient, CreatePatientData, UpdatePatientData, PatientModalProps, PaginationInfo } from './patients';
export type { Specialty, Appointment, AppointmentModalProps } from './appointments';

// Context Types
export type { AuthContextType, AuthUser as AuthContextUser, SidebarContextType } from './contexts';

// Component Types
export type {
  StandardModalProps,
  EmptyStateProps,
  LoadingStateProps,
  PageContainerProps,
  PageHeaderProps,
  FilterField,
  FilterPanelProps,
  DataListItem,
  DataListProps,
  PatientSearchProps,
  ChangeStatusModalProps,
  ChangeSpecialtyModalProps,
  ReprogramAppointmentModalProps,
  PatientAppointmentModalProps,
  PreclinicaData,
  PreclinicaModalProps,
  ConsultaData
} from './components';

// UI Component Types
export type {
  BadgeProps,
  ButtonProps,
  SpinnerProps,
  SpinnerWithTextProps,
  SearchableSelectOption,
  SearchableSelectProps
} from './ui';

// Hook Types
export type {
  UsePageDataOptions,
  UsePageDataReturn,
  ToastState,
  ToastType,
  ToastActionElement
} from './hooks';

// Price System Types
export type {
  Price,
  PriceWithRelations,
  PriceVariant,
  Tag,
  PriceSpecialty,
  PriceTag,
  CreatePriceData,
  UpdatePriceData,
  CreateVariantData,
  UpdateVariantData,
  PriceFormData,
  VariantFormData,
  PriceModalProps,
  VariantModalProps,
  PricesResponse,
  PriceResponse,
  VariantsResponse,
  TagsResponse
} from './prices';

// Payment System Types
export type {
  PaymentStatus,
  PaymentItem,
  PaymentItemWithRelations,
  Payment,
  PaymentWithRelations,
  CreatePaymentItemData,
  CreatePaymentData,
  UpdatePaymentData,
  PaymentsResponse,
  PaymentResponse,
  PaymentFormData,
  PaymentModalProps,
  PaymentItemSelectorProps
} from './payments';

// Invoice System Types
export type {
  InvoiceRangeStatus,
  InvoiceRange,
  InvoiceRangeWithInvoices,
  LegalInvoice,
  LegalInvoiceWithRelations,
  LegalInvoiceItem,
  SimpleReceipt,
  SimpleReceiptItem,
  SimpleReceiptWithRelations,
  CreateInvoiceRangeData,
  UpdateInvoiceRangeData,
  CreateLegalInvoiceData,
  CreateSimpleReceiptData,
  InvoiceRangesResponse,
  InvoiceRangeResponse,
  LegalInvoicesResponse,
  LegalInvoiceResponse,
  InvoiceRangeFormData,
  InvoiceRangeModalProps
} from './invoices';

// Radiology System Types
export type {
  RadiologyOrderStatus,
  RadiologyOrder,
  RadiologyOrderWithRelations,
  CreateRadiologyOrderData,
  UpdateRadiologyOrderData,
  RadiologyOrderListItem,
  RadiologyOrderModalProps,
  RadiologyResultsModalProps
} from './radiology';

// Dashboard types
export type {
  AdminStats,
  CashierStats,
  ReceptionStats,
  RadiologistStats,
  SpecialistStats,
  ChartDataPoint
} from './dashboard';

// Hospitalization types
export type {
  HospitalizationStatus,
  RoomStatus,
  Room,
  SalaDoctor,
  Hospitalization,
  HospitalizationWithRelations,
  CreateHospitalizationData,
  UpdateHospitalizationData,
  HospitalizationCostCalculation,
  HospitalizationModalProps,
  HospitalizationDetailsModalProps,
  DischargeModalProps,
  RoomModalProps,
  InsulinControl,
  CreateInsulinControlData,
  IntakeOutputControl,
  CreateIntakeOutputControlData,
  IntakeType,
  ExcretaType,
  IntakeOutputType
} from './hospitalization';

// API Types
export type {
  PrismaWhereFilter,
  PrismaSalesWhereFilter,
  PrismaPricesWhereFilter,
  PatientRawResult,
  CountRawResult,
  TagForSorting,
  SpecialtyForSorting,
  ServiceItemForSorting,
  SessionUser,
  ApiResponse
} from './api';