'use client';

import React from 'react';
import { standardClasses } from '@/styles/design-system';
import { PageContainerProps } from '@/types/components';

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`${standardClasses.pageContainer} ${className}`}>
      {children}
    </div>
  );
}

