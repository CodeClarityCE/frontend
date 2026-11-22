export interface Source {
  Type: string;
  Url: string;
}

export interface SeverityDist {
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

export class DependencyDetails {
  name!: string;
  version!: string;
  latest_version!: string;
  dependencies!: Record<string, string>;
  dev_dependencies!: Record<string, string>;
  // Listed in the workspace's own manifest, as in the SBOM table
  direct!: boolean;
  transitive!: boolean;
  source?: Source;
  package_manager!: string;
  license!: string;
  engines?: Record<string, string>;
  // Null when the release date is unknown
  release_date!: Date | null;
  lastest_release_date!: Date | null;
  vulnerabilities!: string[];
  severity_dist!: SeverityDist;
  // file_path!: string;
  // mean_severity!: number;
  // combined_severity!: number;
  // patchable_paths!: string[];
  // patch_type!: string;
  // deprecated!: boolean;
}
