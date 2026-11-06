import { Type } from "class-transformer";
import {
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
}
