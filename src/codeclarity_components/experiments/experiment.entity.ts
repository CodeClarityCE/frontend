import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export enum ExperimentStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
}

export enum ExperimentRunStatus {
  PENDING = "pending",
  DONE = "done",
  FAILED = "failed",
  SKIPPED = "skipped",
}

/** Step between an experiment's grid dates */
export enum GridInterval {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
}

export const GridIntervalLabels: Record<GridInterval, string> = {
  [GridInterval.DAY]: "Daily",
  [GridInterval.WEEK]: "Weekly",
  [GridInterval.MONTH]: "Monthly",
};

/** Grid defaults and bounds, as in the API */
export const DEFAULT_GRID_INTERVAL = GridInterval.MONTH;
export const DEFAULT_GRID_COUNT = 24;
export const MAX_GRID_COUNT = 120;

/** Largest analysis budget the API accepts */
export const MAX_ANALYSIS_BUDGET = 1_000_000;

/**
 * Fix probes estimated per repository per grid interval. From the archived
 * top100 study: halving over its fix windows took 6715 probes for 100 repos
 * x 40 intervals (about 1.7), rounded up to cover introductions.
 */
export const PROBES_PER_ENTRY_INTERVAL = 2;

/** Plugins an analyzer must contain to be used by an experiment */
export const EXPERIMENT_REQUIRED_PLUGINS = ["js-sbom", "vuln-finder"];

/** An experiment in one of these states may still change */
export const ACTIVE_EXPERIMENT_STATUSES: readonly ExperimentStatus[] = [
  ExperimentStatus.PENDING,
  ExperimentStatus.RUNNING,
];

export const ExperimentStatusLabels: Record<ExperimentStatus, string> = {
  [ExperimentStatus.PENDING]: "Pending",
  [ExperimentStatus.RUNNING]: "Running",
  [ExperimentStatus.COMPLETED]: "Completed",
  [ExperimentStatus.CANCELLED]: "Cancelled",
  [ExperimentStatus.FAILED]: "Failed",
};

export const ExperimentStatusColors: Record<ExperimentStatus, string> = {
  [ExperimentStatus.PENDING]: "bg-gray-100 text-gray-800",
  [ExperimentStatus.RUNNING]: "bg-blue-100 text-blue-800",
  [ExperimentStatus.COMPLETED]: "bg-green-100 text-green-800",
  [ExperimentStatus.CANCELLED]: "bg-yellow-100 text-yellow-800",
  [ExperimentStatus.FAILED]: "bg-red-100 text-red-800",
};

export const ExperimentRunStatusLabels: Record<ExperimentRunStatus, string> = {
  [ExperimentRunStatus.PENDING]: "Pending",
  [ExperimentRunStatus.DONE]: "Done",
  [ExperimentRunStatus.FAILED]: "Failed",
  [ExperimentRunStatus.SKIPPED]: "Skipped",
};

export const ExperimentRunStatusColors: Record<ExperimentRunStatus, string> = {
  [ExperimentRunStatus.PENDING]: "bg-gray-100 text-gray-800",
  [ExperimentRunStatus.DONE]: "bg-green-100 text-green-800",
  [ExperimentRunStatus.FAILED]: "bg-red-100 text-red-800",
  [ExperimentRunStatus.SKIPPED]: "bg-yellow-100 text-yellow-800",
};

export interface ExperimentRunCounts {
  pending: number;
  done: number;
  failed: number;
  skipped: number;
}

/** An experiment that may still change (PENDING or RUNNING). */
export function isExperimentActive(experiment: { status: ExperimentStatus }): boolean {
  return ACTIVE_EXPERIMENT_STATUSES.includes(experiment.status);
}

/** Runs that reached a terminal state: done, failed or skipped */
export function finishedRunCount(counts: ExperimentRunCounts): number {
  return counts.done + counts.failed + counts.skipped;
}

/** "-" when unset; the day, with the time unless `withTime` is false. */
export function formatExperimentDate(
  date: Date | string | null,
  withTime = true,
): string {
  if (!date) return "-";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  if (!withTime) return new Date(date).toLocaleDateString("en-US", options);
  return new Date(date).toLocaleString("en-US", {
    ...options,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface AnalyzerStepSnapshot {
  name: string;
  version: string;
}

export class Experiment {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  name!: string;

  @IsEnum(ExperimentStatus)
  status!: ExperimentStatus;

  @IsInt()
  retries!: number;

  @IsEnum(GridInterval)
  grid_interval!: GridInterval;

  /** Grid dates before HEAD; 0 is HEAD only */
  @IsInt()
  grid_count!: number;

  /** Calendar days of the grid (YYYY-MM-DD), oldest first, HEAD excluded */
  @IsArray()
  grid_dates!: string[];

  /** Most analyses it may submit, null for no budget */
  @IsOptional()
  @IsInt()
  analysis_budget!: number | null;

  @IsOptional()
  @IsString()
  error!: string | null;

  @IsNotEmpty()
  dataset_id!: string;

  @IsString()
  dataset_name!: string;

  @IsOptional()
  @IsString()
  analyzer_id!: string | null;

  @IsOptional()
  @IsString()
  analyzer_name!: string | null;

  @IsOptional()
  analyzer_steps!: AnalyzerStepSnapshot[][] | null;

  @IsOptional()
  @IsString()
  created_by_name!: string | null;

  @IsNotEmpty()
  @Type(() => Date)
  created_on!: Date;

  @IsOptional()
  @Type(() => Date)
  started_on!: Date | null;

  @IsOptional()
  @Type(() => Date)
  ended_on!: Date | null;

  @IsInt()
  run_count!: number;

  @IsNotEmpty()
  run_counts!: ExperimentRunCounts;
}

export interface ExperimentRunEntry {
  id: string;
  rank: number;
  full_name: string;
  git_url: string;
  stars: number;
}

export class ExperimentRun {
  @IsNotEmpty()
  id!: string;

  @IsEnum(ExperimentRunStatus)
  status!: ExperimentRunStatus;

  @IsOptional()
  @IsString()
  error!: string | null;

  @IsInt()
  attempts!: number;

  @IsOptional()
  @IsString()
  branch!: string | null;

  @IsOptional()
  @IsString()
  commit_hash!: string | null;

  @IsOptional()
  @Type(() => Date)
  committed_at!: Date | null;

  @IsInt()
  grid_index!: number;

  /** Null for HEAD */
  @IsOptional()
  @Type(() => Date)
  grid_date!: Date | null;

  /** The run whose analysis this snapshot shares (same pinned commit) */
  @IsOptional()
  @IsString()
  shared_from_run_id!: string | null;

  @IsOptional()
  @Type(() => Date)
  submitted_on!: Date | null;

  @IsOptional()
  @Type(() => Date)
  ended_on!: Date | null;

  @IsOptional()
  @IsString()
  analysis_id!: string | null;

  @IsOptional()
  @IsString()
  project_id!: string | null;

  @IsNotEmpty()
  entry!: ExperimentRunEntry;
}

export interface CreateExperimentRequest {
  name: string;
  dataset_id: string;
  analyzer_id: string;
  retries?: number;
  grid_interval?: GridInterval;
  grid_count?: number;
  /** Omitted for no budget */
  analysis_budget?: number;
}

/* Dataset-level results, computed by the API from the done runs */

export const SEVERITY_ORDER = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NONE",
] as const;

export type SeverityCounts = Record<(typeof SEVERITY_ORDER)[number], number>;

export type SweepSubset = "all" | "match_correct_only" | "non_withdrawn";

export const SweepSubsetLabels: Record<SweepSubset, string> = {
  all: "All instances",
  match_correct_only: "Correct matches only",
  non_withdrawn: "Not withdrawn",
};

export interface HeadlineScalars {
  n_projects: number;
  n_affected: number;
  affected_share: number | null;
  instances: number;
  distinct_vuln_packages: number;
  load_median: number | null;
  load_mean: number | null;
  load_max: number | null;
  high_critical_share: number | null;
  top10_pkg_share: number | null;
  top10_proj_share: number | null;
  gini_pkg: number | null;
  gini_proj: number | null;
  pkgs_clear_50: number;
  pkgs_clear_80: number;
  pkgs_clear_90: number;
}

export interface Headline extends HeadlineScalars {
  sev_counts: SeverityCounts;
  /** [package, projects affected], most widespread first */
  top_packages: [string, number][];
  high_critical_share_of_classed: number | null;
}

export interface SweepRow extends HeadlineScalars {
  subset: SweepSubset;
}

export interface EpssBlock {
  nonnull_share: number | null;
  median: number | null;
  p90: number | null;
  over_10pct: number;
  over_50pct: number;
  missing_non_cve: number;
  missing_cve: number;
}

export interface RqcBlock {
  spearman_rho: number | null;
  p: number | null;
  n: number;
  excluded_zero_dep_projects: number;
}

export interface RqdRow {
  package_manager: string;
  projects: number;
  med_deps: number;
  med_vulns: number;
}

export interface CoverageBlock {
  runs: number;
  attempted: number;
  done: number;
  failed: number;
  skipped: number;
  pending: number;
  failure_reasons: Record<string, number>;
  skip_reasons: Record<string, number>;
}

/** Run states of one snapshot of the grid */
export interface GridCoverageRow {
  /** YYYY-MM-DD, null for HEAD */
  grid_date: string | null;
  runs: number;
  /** Done with rows */
  done: number;
  /** Done but empty: no lockfile yet at that date */
  empty: number;
  failed: number;
  skipped: number;
  pending: number;
  /** Its runs were matched against different knowledge */
  mixed_knowledge: boolean;
}

export interface KnowledgeSnapshot {
  knowledge_sources: Record<string, string | null>;
  epss_rows: number;
}

export interface ProvenanceBlock {
  api_version: string | null;
  analyzer_steps: AnalyzerStepSnapshot[][] | null;
  knowledge_start: KnowledgeSnapshot | null;
  knowledge_end: KnowledgeSnapshot | null;
  /** Knowledge sources differ between the start and end snapshots */
  knowledge_changed: boolean;
  created_by: string | null;
  created_on: Date | string;
  started_on: Date | string | null;
  ended_on: Date | string | null;
}

export const SeverityLabels: Record<keyof SeverityCounts, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  NONE: "No severity",
};

export type FixKind = "upgraded" | "removed_direct" | "removed_transitive";

/** Fix kinds, plus "unknown" when the state after a fix is not known */
export const FixKindLabels: Record<FixKind | "unknown", string> = {
  upgraded: "Upgraded",
  removed_direct: "Removed directly",
  removed_transitive: "Removed transitively",
  unknown: "Unknown",
};

export type DatingPrecision = "commit" | "snapshot";

/** A lag distribution in days */
export interface LagSummary {
  n: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  min: number | null;
  max: number | null;
  /** Lags below zero: fixed before the advisory was published */
  before_disclosure: number;
}

/** One group of a lag block: a severity class or a fix kind */
export interface LagGroup extends LagSummary {
  key: string;
}

export interface FixLagPoint {
  severity: keyof SeverityCounts;
  kind: FixKind | null;
  lag_days: number;
  precision: DatingPrecision;
}

export interface FixLagBlock {
  fixes: number;
  snapshot_precision_share: number | null;
  overall: LagSummary;
  by_severity: LagGroup[];
  by_kind: LagGroup[];
  points: FixLagPoint[];
}

export interface ExposuresBlock {
  exposures: number;
  open: number;
  fixed: number;
  introductions: number;
  present_at_first_observation: number;
  fix_precision: Record<DatingPrecision, number>;
  introduction_precision: Record<DatingPrecision, number>;
}

/** Events by how fix probes ended; not_probed while they have not */
export interface ProbeOutcomeCounts {
  found: number;
  ambiguous: number;
  not_found: number;
  not_probed: number;
}

/** How fix probes dated the fixes and introductions */
export interface ProbesBlock {
  fixes: ProbeOutcomeCounts;
  introductions: ProbeOutcomeCounts;
  /** Not-found events per reason, most frequent first */
  not_found_reasons: Record<string, number>;
  /** Absent from results of older APIs */
  budget?: ProbeBudget;
}

/** The analysis budget, what was submitted against it and whether it is spent */
export interface ProbeBudget {
  analysis_budget: number | null;
  analyses_submitted: number | null;
  spent: boolean;
}

/** Instance load of one grid date in the hindsight and as-of views */
export interface LoadRow {
  /** YYYY-MM-DD, null for HEAD */
  grid_date: string | null;
  /** The as-of cutoff: the grid date, or the end date for HEAD (null while running) */
  as_of_date: string | null;
  /** Done snapshots, empty ones included */
  projects: number;
  /** Null without a done snapshot */
  hindsight: number | null;
  as_of: number | null;
  /** Instances without a readable published date, kept in the as-of view */
  undated: number;
}

/** A distribution of day counts */
export interface DaysSummary {
  n: number;
  median: number | null;
  p25: number | null;
  p75: number | null;
  min: number | null;
  max: number | null;
}

/** One severity class of a days distribution */
export interface DaysGroup extends DaysSummary {
  key: string;
}

export interface ResidencePoint {
  severity: keyof SeverityCounts;
  residence_days: number;
  precision: DatingPrecision;
}

/** Introduction to disclosure; introductions after it are counted apart */
export interface ResidenceBlock {
  introductions: number;
  snapshot_precision_share: number | null;
  present_at_first_observation: number;
  /** Introductions whose advisory has no publication date */
  undated: number;
  overall: DaysSummary;
  by_severity: DaysGroup[];
  points: ResidencePoint[];
  /** Days from publication to introduction */
  after_disclosure: DaysSummary;
  after_disclosure_by_severity: DaysGroup[];
}

/** One Kaplan-Meier step; survival is 1 before the first */
export interface KmStep {
  time: number;
  survival: number;
  at_risk: number;
  events: number;
  censored: number;
}

/** A survival curve over every exposure ("all") or one severity class */
export interface SurvivalGroup {
  key: string;
  n: number;
  fixed: number;
  censored: number;
  median_days: number | null;
  curve: KmStep[];
}

export interface ExposureSurvivalBlock {
  /** YYYY-MM-DD open exposures are censored at */
  censored_at: string;
  snapshot_precision_share: number | null;
  overall: SurvivalGroup;
  by_severity: SurvivalGroup[];
}

/** Instance concentration at one grid date */
export interface PackagesToClearRow {
  /** YYYY-MM-DD, null for HEAD */
  grid_date: string | null;
  projects: number;
  instances: number;
  distinct_packages: number;
  /** Null when no snapshot at this date is done */
  pkgs_clear_50: number | null;
  pkgs_clear_80: number | null;
}

export interface FixKindCounts {
  fixes: number;
  upgraded: number;
  removed_direct: number;
  removed_transitive: number;
  unknown: number;
  /** Over fixes of known kind; unknown ones are left out */
  removed_transitive_share: number | null;
  snapshot_precision_share: number | null;
}

/** Fixes in the grid interval (from, to]; to is null for HEAD */
export interface FixKindRow extends FixKindCounts {
  interval_from: string | null;
  interval_to: string | null;
}

export interface UpstreamLeverageBlock {
  packages_to_clear: PackagesToClearRow[];
  fix_kinds: FixKindRow[];
  overall: FixKindCounts;
}

export interface ExperimentResults {
  coverage: CoverageBlock;
  /** Coverage per grid date, oldest first, HEAD last */
  grid_coverage: GridCoverageRow[];
  headline: Headline;
  sweep: SweepRow[];
  epss: EpssBlock;
  match_flags: Record<string, number>;
  winning_source_head: Record<string, number>;
  rqc: RqcBlock;
  rqd: RqdRow[];
  /** Exposures over the whole grid; absent from results of older APIs */
  exposures?: ExposuresBlock;
  fix_lag?: FixLagBlock;
  probes?: ProbesBlock;
  /** Per grid date, HEAD last; absent from results of older APIs */
  load_over_time?: LoadRow[];
  residence?: ResidenceBlock;
  exposure_survival?: ExposureSurvivalBlock;
  upstream_leverage?: UpstreamLeverageBlock;
  provenance: ProvenanceBlock;
}

export const EXPERIMENT_EXPORT_FILES = [
  "runs.csv",
  "vulnerabilities.csv",
  "exposures.csv",
  "fixes.csv",
  "results.json",
] as const;

export type ExperimentExportFile = (typeof EXPERIMENT_EXPORT_FILES)[number];
