'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableSelectOption, SearchableSelectProps } from '@/types/ui';

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<SearchableSelectOption[]>(options);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SearchableSelectOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Encontrar la opción seleccionada
  useEffect(() => {
    const option = [...options, ...filteredOptions].find(opt => opt.value === value);
    setSelectedOption(option || null);
  }, [value, options, filteredOptions]);

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

  // Buscar en servidor
  useEffect(() => {
    if (onSearch && searchTerm.trim().length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          setLoading(true);
          const results = await onSearch(searchTerm.trim());
          const localFiltered = options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
          );
          const combinedResults = [...localFiltered];
          results.forEach(serverResult => {
            if (!combinedResults.some(local => local.value === serverResult.value)) {
              combinedResults.push(serverResult);
            }
          });
          setFilteredOptions(combinedResults);
        } catch (error) {
          console.error('Error searching:', error);
          const localFiltered = options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
          );
          setFilteredOptions(localFiltered);
        } finally {
          setLoading(false);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, onSearch, options]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen && searchRef.current) {
        setTimeout(() => searchRef.current?.focus(), 100);
      }
    }
  };

  // Manejar click fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium text-gray-700">
          {label}
        </Label>
      )}
      
      <div ref={containerRef} className="relative">
        {/* Trigger personalizado */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]",
            error && "border-red-500",
            selectedOption && "border-green-300 bg-green-50/50"
          )}
        >
          <div className="flex items-center space-x-2">
            {selectedOption && (
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            )}
            <span className={cn(!selectedOption && "text-muted-foreground")}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>

        {/* Dropdown personalizado */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg min-w-[400px]">
            {/* Campo de búsqueda */}
            <div className="p-2 border-b">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-500" />
                <Input
                  ref={searchRef}
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-[#2E9589] focus:ring-[#2E9589]"
                />
              </div>
            </div>
            
            {/* Lista de opciones */}
            <div className="max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2E9589] mx-auto mb-2"></div>
                  Buscando...
                </div>
              ) : filteredOptions.length === 0 ? (
                <>
                  <div className="p-4 text-center text-gray-500">
                    {onSearch && searchTerm.length < 2 
                      ? 'Escribe al menos 2 caracteres para buscar'
                      : emptyMessage
                    }
                  </div>
                  
                  {/* Opción para agregar nuevo cuando no hay resultados */}
                  {onAddNew && searchTerm.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddNew();
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className="w-full flex items-center justify-center p-3 hover:bg-[#2E9589]/10 cursor-pointer border-t border-gray-200 text-[#2E9589] font-medium"
                    >
                      <span className="text-sm">+ Agregar &quot;{searchTerm}&quot;</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {filteredOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 text-left",
                        value === option.value && "bg-[#2E9589]/10"
                      )}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {option.label}
                        </div>
                        {option.description && (
                          <div className="text-sm text-gray-600">
                            {option.description}
                          </div>
                        )}
                      </div>
                      {value === option.value && (
                        <Check size={16} className="text-[#2E9589]" />
                      )}
                    </button>
                  ))}
                  
                  {/* Opción para agregar nuevo */}
                  {onAddNew && (
                    <button
                      type="button"
                      onClick={() => {
                        onAddNew();
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className="w-full flex items-center justify-center p-3 hover:bg-[#2E9589]/10 cursor-pointer border-t border-gray-200 text-[#2E9589] font-medium"
                    >
                      <span className="text-sm">{addNewLabel}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
