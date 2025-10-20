export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RadiologyConfig {
  radiologyTagId: string | null;
}

export type ConfigKey = 'radiology' | 'general';

export interface ConfigValue {
  radiology: RadiologyConfig;
  general: Record<string, unknown>;
}

