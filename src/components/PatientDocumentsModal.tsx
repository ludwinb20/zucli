"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PatientDocumentsSection from '@/components/PatientDocumentsSection';

interface PatientDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export default function PatientDocumentsModal({
  isOpen,
  onClose,
  patientId,
  patientName,
}: PatientDocumentsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col bg-white p-0">
        <DialogHeader className="p-6 pb-4 border-b-4 border-[#2E9589]">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Documentos Médicos - {patientName}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 p-6">
          <PatientDocumentsSection patientId={patientId} showHeader={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

