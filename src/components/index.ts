// Exportar todos los componentes desde un lugar central

// Layout components
export { PageContainer } from './layout/PageContainer';
export { PageHeader } from './layout/PageHeader';

// Common components
export { LoadingState } from './common/LoadingState';
export { EmptyState } from './common/EmptyState';
export { DataList } from './common/DataList';
export { FilterPanel } from './common/FilterPanel';
export { StandardModal } from './common/StandardModal';
export { SearchableSelect } from './common/SearchableSelect';
export { PatientSearch } from './common/PatientSearch';

// UI components (existing)
export { AppNavbar } from './AppNavbar';
export { AppSidebar } from './AppSidebar';
export { ConditionalLayout } from './ConditionalLayout';
export { LoadingSpinner } from './LoadingSpinner';
export { PasswordModal } from './PasswordModal';
export { PatientModal } from './PatientModal';
export { UserModal } from './UserModal';
export {default as AppointmentModal } from './AppointmentModal';

// Treatment components
export { TreatmentItemsSelector } from './TreatmentItemsSelector';
export { AddItemPopover } from './AddItemPopover';

// Payment components
export { default as PaymentModal } from './PaymentModal';
export { default as PaymentDetailsModal } from './PaymentDetailsModal';
export { default as EditPaymentItemsModal } from './EditPaymentItemsModal';

// Types
export type { DataListItem } from './common/DataList';
export type { FilterField } from './common/FilterPanel';
export type { SearchableSelectOption } from './common/SearchableSelect';

