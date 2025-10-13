'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { standardClasses } from '@/styles/design-system';
import { PageHeaderProps } from '@/types/components';

export function PageHeader({ 
  title, 
  description, 
  actionButton, 
  children 
}: PageHeaderProps) {
  return (
    <div className={standardClasses.headerSection}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={standardClasses.headerTitle}>
            {title}
          </h2>
          <p className={standardClasses.headerDescription}>
            {description}
          </p>
        </div>
        {actionButton && (
          <Button 
            onClick={actionButton.onClick}
            className={`flex items-center space-x-2 ${standardClasses.primaryButton}`}
          >
            {actionButton.icon}
            <span>{actionButton.label}</span>
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}

