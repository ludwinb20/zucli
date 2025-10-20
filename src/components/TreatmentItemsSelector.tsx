"use client";

import React from "react";
import { TreatmentItem } from "@/types/components";
import { CompactItemSelector } from "@/components/CompactItemSelector";

interface TreatmentItemsSelectorProps {
  items: TreatmentItem[];
  onChange: (items: TreatmentItem[]) => void;
  specialtyId?: string;
  includeTags?: string[];
  excludeTags?: string[];
  prioritizeTags?: string[];
}

export function TreatmentItemsSelector({ 
  items, 
  onChange,
  specialtyId,
  includeTags,
  excludeTags,
  prioritizeTags
}: TreatmentItemsSelectorProps) {
  return (
    <CompactItemSelector
      items={items}
      onChange={onChange}
      specialtyId={specialtyId}
      includeTags={includeTags}
      excludeTags={excludeTags}
      prioritizeTags={prioritizeTags}
    />
  );
}

