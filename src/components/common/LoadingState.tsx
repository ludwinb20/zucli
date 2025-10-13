'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { standardClasses } from '@/styles/design-system';
import { LoadingStateProps } from '@/types/components';

export function LoadingState({ 
  message = 'Cargando...', 
  showCard = true 
}: LoadingStateProps) {
  const content = (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center space-y-4">
        <div className={standardClasses.loadingSpinner}></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card className={standardClasses.card}>
        <CardContent>
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
}

