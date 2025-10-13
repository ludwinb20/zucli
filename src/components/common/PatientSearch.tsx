'use client';

import React, { useState, useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { Patient, SearchableSelectOption, PatientSearchProps } from '@/types';

export function PatientSearch({ 
  value, 
  onChange, 
  placeholder = "Seleccionar paciente...",
  label = "Paciente *",
  error,
  className = "",
  onAddNewPatient
}: PatientSearchProps) {
  const [selectedPatientName, setSelectedPatientName] = useState<string>('');
  const [defaultOptions, setDefaultOptions] = useState<SearchableSelectOption[]>([]);

  // Cargar pacientes por defecto al montar el componente
  useEffect(() => {
    const loadDefaultPatients = async () => {
      try {
        const response = await fetch(`/api/patients?limit=10`);
        if (response.ok) {
          const data = await response.json();
          const patients: Patient[] = data.patients || data;
          
          const options = patients.map((patient: Patient) => ({
            value: patient.id,
            label: `${patient.firstName} ${patient.lastName}`,
            description: `ID: ${patient.identityNumber}${patient.phone ? ` • ${patient.phone}` : ''}`
          }));
          
          setDefaultOptions(options);
        }
      } catch (error) {
        console.error('Error loading default patients:', error);
      }
    };

    loadDefaultPatients();
  }, []);

  // Obtener nombre del paciente seleccionado
  useEffect(() => {
    const getSelectedPatientName = async () => {
      if (value) {
        try {
          const response = await fetch(`/api/patients/${value}`);
          if (response.ok) {
            const patient = await response.json();
            setSelectedPatientName(`${patient.firstName} ${patient.lastName}`);
          }
        } catch (error) {
          console.error('Error fetching selected patient:', error);
        }
      } else {
        setSelectedPatientName('');
      }
    };

    getSelectedPatientName();
  }, [value]);
  
  const searchPatients = async (searchTerm: string): Promise<SearchableSelectOption[]> => {
    try {
      const response = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}&limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        const patients: Patient[] = data.patients || data;
        
        return patients.map((patient: Patient) => ({
          value: patient.id,
          label: `${patient.firstName} ${patient.lastName}`,
          description: `ID: ${patient.identityNumber}${patient.phone ? ` • ${patient.phone}` : ''}`
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  };

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      placeholder={selectedPatientName || placeholder}
      label={label}
      error={error}
      className={className}
      searchPlaceholder="Buscar por nombre o número de identidad..."
      emptyMessage="No se encontraron pacientes"
      onSearch={searchPatients}
      options={defaultOptions}
      onAddNew={onAddNewPatient}
      addNewLabel="+ Agregar nuevo paciente"
    />
  );
}
