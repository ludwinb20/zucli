'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableSelectOption, SearchableSelectProps } from '@/types/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type { SearchableSelectOption };

export function SearchableSelect({
  value,
  onChange,
  placeholder = "Seleccionar...",
  label,
  error,
  className = "",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  onSearch,
  options = [],
  disabled = false,
  onAddNew,
  addNewLabel = "+ Agregar nuevo"
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<SearchableSelectOption[]>(options);
  const [loading, setLoading] = useState(false);

  // Filtrar opciones locales
  useEffect(() => {
    if (options.length > 0) {
      if (searchTerm.trim().length === 0) {
        setFilteredOptions(options);
      } else {
        const filtered = options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredOptions(filtered);
      }
    }
  }, [searchTerm, options]);

  // Búsqueda remota
  useEffect(() => {
    if (onSearch && searchTerm.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setLoading(true);
        try {
          const results = await onSearch(searchTerm);
          setFilteredOptions(results);
        } catch (error) {
          console.error('Error en búsqueda:', error);
          setFilteredOptions([]);
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, onSearch]);

  const handleValueChange = (newValue: string) => {
    onChange(newValue);
  };

  // Encontrar la opción seleccionada para mostrar solo el nombre
  const selectedOption = [...options, ...filteredOptions].find(opt => opt.value === value);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
        </Label>
      )}
      
      <Select value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger className={cn(
          "w-full",
          error && "border-red-300 focus:ring-red-500 focus:border-red-500"
        )}>
          <SelectValue placeholder={placeholder}>
            {selectedOption ? selectedOption.label : placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {/* Campo de búsqueda */}
          <div className="p-2 border-b sticky top-0 bg-white z-10">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-500" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Lista de opciones */}
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2E9589] mx-auto mb-2"></div>
              Buscando...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {onSearch && searchTerm.length < 2 
                ? 'Escribe al menos 2 caracteres para buscar'
                : emptyMessage
              }
            </div>
          ) : (
            filteredOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  {option.description && (
                    <span className="text-sm text-gray-600">{option.description}</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}

          {/* Opción para agregar nuevo */}
          {onAddNew && (
            <div className="border-t">
              <button
                type="button"
                onClick={() => {
                  onAddNew();
                  setSearchTerm('');
                }}
                className="w-full flex items-center justify-center p-3 hover:bg-[#2E9589]/10 cursor-pointer text-[#2E9589] font-medium text-sm transition-colors"
              >
                {addNewLabel}
              </button>
            </div>
          )}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}