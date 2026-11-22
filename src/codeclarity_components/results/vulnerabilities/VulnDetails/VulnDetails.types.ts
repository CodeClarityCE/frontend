interface VulnSourceInfo {
  name: string;
  vuln_url: string;
}

export interface VulnerabilityInfo {
  vulnerability_id: string;
  description: string;
  version_info: VersionInfo;
  published: string;
  last_modified: string;
  sources: VulnSourceInfo[];
  aliases: string[];
}

interface SourceComparison {
  agree: boolean;
  nvdReason?: string;
  nvdAllVersions?: string;
  osvReason?: string;
  osvAllVersions?: string;
  gcveReason?: string;
  gcveAllVersions?: string;
}

interface VersionInfo {
  affected_versions_string: string;
  affected_versions_source?: string;
  patched_versions_string: string;
  versions: VulnerableVersionInfo[];
  source_comparison?: SourceComparison;
}

interface VulnerableVersionInfo {
  version: string;
  status: string;
  release: string;
}

export interface DependencyInfo {
  name: string;
  published: string;
  description: string;
  keywords: string[];
  version: string;
  package_manager_links: PackageManagerLink[];
  github_link?: string | null;
  issues_link?: string;
  homepage?: string;
}

interface PackageManagerLink {
  package_manager: string;
  url: string;
}

export interface CVSSInfo {
  base_score: number | null;
  exploitability_score?: number;
  impact_score?: number;
  [key: string]: string | number | null | undefined;
}

export interface SeverityInfo {
  cvss_4?: CVSSInfo | null;
  cvss_31?: CVSSInfo | null;
  cvss_3?: CVSSInfo | null;
  cvss_2?: CVSSInfo | null;
  // GHSA's severity, such as "HIGH", when the record has no vector.
  ghsa?: string;
}

export interface OwaspInfo {
  name: string;
  description: string;
}

export interface WeaknessInfo {
  id: string;
  name: string;
  description: string;
}

export interface CommonConsequencesInfo {
  scope: string[];
  impact: string[];
  description: string;
}

export interface ReferenceInfo {
  url: string;
  tags: string[];
}

export interface OtherInfo {
  package_manager: string;
}

// What one knowledge source said about a vulnerability instance.
/** @public type-sync copy of an API enum: every API value stays */
export enum SourceVerdictValue {
  Matched = "matched",
  NoRecord = "no_record",
  StaleOrFailed = "stale_or_failed",
  VersionExcluded = "version_excluded",
  Retired = "retired",
  NamesAnotherProduct = "names_another_product",
  NoPackageData = "no_package_data",
}

export interface SourceRange {
  introduced?: string;
  fixed?: string;
}

export interface SourceAffected {
  ranges: SourceRange[];
  exact: string[];
  universal: boolean;
}

// A product or package a record names; OSV gives ecosystem and package, GCVE and NVD vendor and product.
export interface SourceProduct {
  ecosystem?: string;
  package?: string;
  vendor?: string;
  product?: string;
  target_sw?: string;
}

interface SourceVerdictEvidence {
  record_ids?: string[];
  /** "stale", "failed" or "unknown", for a stale or failed verdict. */
  source_status?: string;
  /** The affected versions checked, for version excluded. */
  evaluated?: SourceAffected;
  /** The GCVE entry marking the version unaffected, for version excluded. */
  unaffected?: SourceAffected;
  /** "rejected", "withdrawn" or "removed", for retired. */
  retired_reason?: string;
  retired_at?: string;
  /** What the record names, for names another product. */
  names?: SourceProduct[];
}

export interface SourceVerdict {
  source: string;
  verdict: SourceVerdictValue;
  evidence?: SourceVerdictEvidence;
}

export class VulnerabilityDetails {
  vulnerability_info!: VulnerabilityInfo;
  dependency_info?: DependencyInfo;
  severities!: SeverityInfo;
  owasp_top_10!: OwaspInfo | null;
  weaknesses!: WeaknessInfo[];
  common_consequences!: Record<string, CommonConsequencesInfo[]>;
  references!: ReferenceInfo[];
  location!: string[];
  other!: OtherInfo;
  source_verdicts?: SourceVerdict[];
  /** False for analyses stored before source verdicts were recorded. */
  source_verdicts_available?: boolean;
}
