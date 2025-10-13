'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { standardClasses } from '@/styles/design-system';
import { DataListItem, DataListProps } from '@/types/components';

export type { DataListItem };

export function DataList({ 
  title, 
  items, 
  emptyMessage, 
  emptyDescription,
  emptyIcon,
  listIcon,
  showCard = true 
}: DataListProps) {
  const EmptyIcon = emptyIcon;
  const ListIcon = listIcon;
  
  const content = (
    <>
      {items.length === 0 ? (
        <div className={standardClasses.emptyState}>
          {EmptyIcon && <EmptyIcon size={48} className={standardClasses.emptyStateIcon} />}
          <p className={standardClasses.emptyStateTitle}>{emptyMessage}</p>
          {emptyDescription && (
            <p className={standardClasses.emptyStateDescription}>{emptyDescription}</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <div key={item.id} className={standardClasses.listItem}>
              <div className="flex items-center space-x-4">
                {ListIcon && (
                  <div className={standardClasses.listItemIcon}>
                    <ListIcon size={24} />
                  </div>
                )}
                <div className={standardClasses.listItemContent}>
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className={standardClasses.listItemTitle}>
                      {item.title}
                    </h3>
                    {item.status && (
                      <Badge variant={item.statusVariant || 'default'}>
                        {item.status}
                      </Badge>
                    )}
                  </div>
                  {item.subtitle && (
                    <p className="text-sm text-gray-600 mb-1">{item.subtitle}</p>
                  )}
                  {item.metadata && item.metadata.length > 0 && (
                    <div className={standardClasses.listItemSubtitle}>
                      {item.metadata.map((meta, index) => (
                        <span key={index} className="flex items-center space-x-1">
                          {meta.icon && <meta.icon size={16} />}
                          <span>{meta.label}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                  )}
                </div>
              </div>
              {item.actions && item.actions.length > 0 && (
                <div className={standardClasses.listItemActions}>
                  {item.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={action.onClick}
                      className={action.className}
                      title={action.label}
                    >
                      <action.icon size={16} />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (showCard) {
    return (
      <Card className={standardClasses.card}>
        <CardHeader>
          <CardTitle className={standardClasses.cardHeader}>
            {title} ({items.length})
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

