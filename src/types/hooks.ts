// Hook Types
export interface UsePageDataOptions<T> {
  fetchFunction: () => Promise<T>;
  dependencies?: unknown[];
  initialData?: T;
}

export interface UsePageDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Toast Hook Types
export interface ToastState {
  toasts: ToastType[];
}

export interface ToastType {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
  open?: boolean;
}

export interface ToastActionElement {
  altText: string;
  [key: string]: unknown;
}

