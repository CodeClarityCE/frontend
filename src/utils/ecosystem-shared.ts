// Generated TypeScript definitions from Go structs
// DO NOT EDIT - This file is auto-generated
// Generated at: 2025-08-20T17:11:33+02:00

export interface EcosystemInfo {
  name: string;
  ecosystem: string;
  language: string;
  packageManagerPattern: string;
  defaultPackageManager: string;
  icon: string;
  color: string;
  website: string;
  purlType: string;
  registryUrl: string;
  tools: string[];
}
export interface DetectedLanguage {
  name: string;
  icon: string;
  color: string;
}
export type PluginEcosystemMap = Record<string, EcosystemInfo>;
export enum MergeStrategy {
  UNION = 'union',
  INTERSECTION = 'intersection',
  PRIORITY = 'priority',
}
