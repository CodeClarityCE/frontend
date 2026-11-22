import type { SourceVerdict } from "./VulnDetails/VulnDetails.types";

export interface WeaknessInfo {
  WeaknessId: string;
  WeaknessName: string;
  WeaknessDescription: string;
  WeaknessExtendedDescription: string;
  OWASPTop10Id: string;
  OWASPTop10Name: string;
}

export interface Severity {
  Severity: number;
  SeverityClass?: string;
  SeverityType: SeverityType;
  Vector: string;
  Impact: number;
  Exploitability: number;
  ConfidentialityImpact: string;
  IntegrityImpact: string;
  AvailabilityImpact: string;
  // Every CVSS vector of the shown record; absent on older analyses.
  Vectors?: { score: number; type: string; vector: string; class: string }[];
}

/** @public type-sync copy of an API enum: every API value stays */
export enum SeverityType {
  CvssV2 = "CVSS_V2",
  CvssV3 = "CVSS_V3",
  CvssV31 = "CVSS_V31",
  CvssV40 = "CVSS_V40",
  // GHSA's label, used when a record has no vector; it has no score.
  Ghsa = "GHSA",
}

enum PatchType {
  Full = "FULL",
  Partial = "PARTIAL",
  None = "NONE",
}

interface Conflict {
  ConflictWinner: string;
  ConflictFlag: string;
}

interface DependencyObject {
  name?: string;
  version?: string;
  [key: string]: unknown;
}

export interface VulnerabilityMerged {
  Sources: Source[];
  Affected: AffectedDeps[];
  Vulnerability: string;
  Severity: Severity;
  Weaknesses: WeaknessInfo[];
  Description: string;
  WinningSource: string;
  Conflict: Conflict;
  VLAI: VLAI[];
  EPSS: EPSS;
  is_blacklisted?: boolean;
  blacklisted_by_policies?: string[];
  Disputed?: boolean;
  /** True when any affected entry is matched by one source origin only. */
  Uncorroborated?: boolean;
}

export interface VLAI {
  Source: Source;
  Score: string;
  Confidence: number;
}

interface EPSS {
  Score: number;
  Percentile: number;
}

interface AffectedDeps {
  Affected: Record<string, AffectedInfo>;
  AffectedDependencyName: string;
  AffectedVersion: string;
  AffectedDependency: string;
  AffectedDependencyFilePath: string;
  AffectedDependencyImportPaths: string[];
  AffectedDependencyObject?: DependencyObject;
  PatchType?: PatchType;
  Disputed?: boolean;
  Uncorroborated?: boolean;
  /** One verdict per knowledge source; absent on older analyses. */
  SourceVerdicts?: SourceVerdict[];
  /** Why the instance is hidden by default; only sent when a filter shows it. */
  Hidden?: HiddenReason;
  /** Sources that withdrew or contradicted one of its source matches. */
  ContradictedBy?: string[];
}

// Why the API hides an instance by default; copy of the API's HiddenReason.
/** @public type-sync copy of an API enum: every API value stays */
export enum HiddenReason {
  Contradicted = "contradicted",
  RetiredAll = "retired_all",
}

/** Instances of each hidden reason, whether or not a filter shows them. */
export type HiddenCounts = Record<HiddenReason, number>;

declare interface AffectedRange {
  IntroducedString: string;
  FixedString: string;
}

declare interface AffectedInfo {
  Exact: string[];
  Ranges: AffectedRange[];
  Universal: boolean;
}

enum Source {
  Nvd = "NVD",
  Osv = "OSV",
  FriendsOfPHP = "FriendsOfPHP",
  Gcve = "GCVE",
}
