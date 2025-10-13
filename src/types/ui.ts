import * as React from 'react';

// UI Component Props
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface SpinnerWithTextProps extends SpinnerProps {
  text?: string;
  textClassName?: string;
}

// Searchable Select Component
export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onSearch?: (searchTerm: string) => Promise<SearchableSelectOption[]>;
  options?: SearchableSelectOption[];
  disabled?: boolean;
  onAddNew?: () => void;
  addNewLabel?: string;
}

