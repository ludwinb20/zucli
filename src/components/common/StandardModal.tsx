'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { standardClasses } from '@/styles/design-system';
import { StandardModalProps } from '@/types/components';

export function StandardModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  size = 'md'
}: StandardModalProps) {
  const sizeClasses = {
    sm: 'sm:max-w-[400px]',
    md: 'sm:max-w-[600px]',
    lg: 'sm:max-w-[800px]',
    xl: 'sm:max-w-[1000px]',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={sizeClasses[size]}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {children}
        </div>

        <DialogFooter>
          {secondaryAction && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={secondaryAction.onClick}
              className={standardClasses.secondaryButton}
            >
              {secondaryAction.label}
            </Button>
          )}
          
          {primaryAction && (
            <Button 
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled || primaryAction.loading}
              className={standardClasses.primaryButton}
            >
              {primaryAction.loading ? 'Guardando...' : primaryAction.label}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

