'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { standardClasses } from '@/styles/design-system';
import { EmptyStateProps } from '@/types/components';

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  showCard = true,
  action 
}: EmptyStateProps) {
  const content = (
    <div className={standardClasses.emptyState}>
      {Icon && <Icon size={48} className={standardClasses.emptyStateIcon} />}
      <p className={standardClasses.emptyStateTitle}>{title}</p>
      <p className={standardClasses.emptyStateDescription}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
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

