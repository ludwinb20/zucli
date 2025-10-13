'use client';

import React, { useState, useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { SearchableSelectOption } from '@/types';

interface PriceSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
  specialtyId?: string;
  type?: 'medicamento' | 'servicio' | 'all';
}

export function PriceSearch({ 
  value, 
  onChange, 
  placeholder = "Seleccionar medicamento/servicio...",
  label = "Medicamento/Servicio *",
  error,
  className = "",
  specialtyId,
  type = 'all'
}: PriceSearchProps) {
  const [selectedPriceName, setSelectedPriceName] = useState<string>('');
  const [defaultOptions, setDefaultOptions] = useState<SearchableSelectOption[]>([]);

  // Cargar precios por defecto al montar el componente
  useEffect(() => {
    const loadDefaultPrices = async () => {
      try {
        let url = `/api/prices?limit=100&isActive=true`;
        if (specialtyId) {
          url += `&specialtyId=${specialtyId}`;
        }
        if (type !== 'all') {
          url += `&type=${type}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const prices = data.prices || [];
          
          const options = prices.map((price: {
            id: string;
            name: string;
            type: string;
            basePrice: number;
            variants?: unknown[];
          }) => ({
            value: price.id,
            label: price.name,
            description: `${price.type === 'medicamento' ? 'Medicamento' : 'Servicio'} • L ${price.basePrice.toFixed(2)}${(price.variants?.length ?? 0) > 0 ? ` • ${price.variants?.length} variante(s)` : ''}`
          }));
          
          setDefaultOptions(options);
        }
      } catch (error) {
        console.error('Error loading default prices:', error);
      }
    };

    loadDefaultPrices();
  }, [specialtyId, type]);

  // Obtener nombre del precio seleccionado
  useEffect(() => {
    const getSelectedPriceName = async () => {
      if (value) {
        try {
          const response = await fetch(`/api/prices/${value}`);
          if (response.ok) {
            const price = await response.json();
            setSelectedPriceName(price.name);
          }
        } catch (error) {
          console.error('Error fetching selected price:', error);
        }
      } else {
        setSelectedPriceName('');
      }
    };

    getSelectedPriceName();
  }, [value]);
  
  const searchPrices = async (searchTerm: string): Promise<SearchableSelectOption[]> => {
    try {
      let url = `/api/prices?search=${encodeURIComponent(searchTerm)}&limit=100&isActive=true`;
      if (specialtyId) {
        url += `&specialtyId=${specialtyId}`;
      }
      if (type !== 'all') {
        url += `&type=${type}`;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        const prices = data.prices || [];
        
        return prices.map((price: {
          id: string;
          name: string;
          type: string;
          basePrice: number;
          variants?: unknown[];
        }) => ({
          value: price.id,
          label: price.name,
          description: `${price.type === 'medicamento' ? 'Medicamento' : 'Servicio'} • L ${price.basePrice.toFixed(2)}${(price.variants?.length ?? 0) > 0 ? ` • ${price.variants?.length} variante(s)` : ''}`
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error searching prices:', error);
      return [];
    }
  };

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      placeholder={selectedPriceName || placeholder}
      label={label}
      error={error}
      className={className}
      searchPlaceholder="Buscar por nombre..."
      emptyMessage="No se encontraron medicamentos/servicios"
      onSearch={searchPrices}
      options={defaultOptions}
    />
  );
}

