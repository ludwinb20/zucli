'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Filter, Search } from 'lucide-react';
import { standardClasses } from '@/styles/design-system';
import { FilterField, FilterPanelProps } from '@/types/components';

export type { FilterField };

export function FilterPanel({ 
  title = 'Filtros', 
  fields, 
  showCard = true,
  className = ''
}: FilterPanelProps) {
  const content = (
    <div className={`${standardClasses.filterGrid} ${className}`}>
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={field.id} className={standardClasses.filterLabel}>
            {field.label}
          </Label>
          
          {field.type === 'text' && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-500" />
              <Input
                id={field.id}
                placeholder={field.placeholder}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className={`pl-10 ${standardClasses.input} ${field.className || ''}`}
              />
            </div>
          )}
          
          {field.type === 'select' && (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className={`${standardClasses.input} ${field.className || ''}`}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {field.type === 'date' && (
            <Input
              id={field.id}
              type="date"
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className={`${standardClasses.input} ${field.className || ''}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  if (showCard) {
    return (
      <Card className={`${standardClasses.card} mb-6`}>
        <CardHeader>
          <CardTitle className={`${standardClasses.cardHeader} flex items-center gap-2`}>
            <Filter size={20} />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

