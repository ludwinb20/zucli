// Sistema de Diseño - Configuración Centralizada
// Colores, espaciado, tipografía y otros tokens de diseño

export const designTokens = {
  // Colores principales
  colors: {
    primary: '#2E9589',
    primaryHover: '#2E9589/90',
    primaryLight: '#2E9589/10',
    secondary: '#4CAF50',
    secondaryHover: '#4CAF50/90',
    secondaryLight: '#4CAF50/10',
    
    // Grises
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
    
    // Estados
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Espaciado
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // Tipografía
  typography: {
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Bordes y radios
  borderRadius: {
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
  },
  
  // Sombras
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
};

// Clases CSS predefinidas
export const standardClasses = {
  // Layout
  pageContainer: 'px-4 sm:px-6 lg:px-8 py-8',
  headerSection: 'mb-8',
  headerTitle: 'text-2xl font-bold text-gray-900 mb-2',
  headerDescription: 'text-gray-600',
  
  // Cards
  card: 'bg-transparent border-gray-200',
  cardHeader: 'text-lg font-semibold text-gray-900',
  
  // Botones
  primaryButton: 'bg-[#2E9589] hover:bg-[#2E9589]/90 text-white',
  secondaryButton: 'border-gray-300 text-gray-700 hover:bg-gray-50',
  dangerButton: 'border-red-300 text-red-600 hover:bg-red-50',
  
  // Inputs
  input: 'border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]',
  label: 'text-sm font-medium text-gray-700',
  
  // Estados
  loadingSpinner: 'animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E9589]',
  emptyState: 'text-center py-12',
  emptyStateIcon: 'text-gray-400 mx-auto mb-4',
  emptyStateTitle: 'text-gray-500 text-lg font-medium',
  emptyStateDescription: 'text-gray-400 text-sm mt-1',
  
  // Lista items
  listItem: 'flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors',
  listItemIcon: 'w-12 h-12 bg-[#2E9589] text-white rounded-full flex items-center justify-center',
  listItemContent: 'flex-1',
  listItemTitle: 'font-medium text-gray-900 text-lg',
  listItemSubtitle: 'flex items-center space-x-4 text-sm text-gray-600',
  listItemActions: 'flex items-center space-x-2',
  
  // Filtros
  filterGrid: 'grid grid-cols-1 md:grid-cols-4 gap-4',
  filterLabel: 'text-sm font-medium text-gray-700',
};

// Configuración de iconos por tipo de contenido
export const contentIcons = {
  patients: 'User',
  appointments: 'Calendar',
  users: 'Users',
  settings: 'Settings',
  dashboard: 'Home',
  invoices: 'FileText',
  consultations: 'Stethoscope',
  default: 'File',
};

// Configuración de colores por estado
export const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  programado: 'bg-blue-100 text-blue-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

