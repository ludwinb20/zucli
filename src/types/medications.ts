export interface MedicationName {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicationNameData {
  name: string;
}

export interface UpdateMedicationNameData {
  name: string;
}
