import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

import type { StatusTone } from "@/base_components/page";

export enum DatasetStatus {
  BUILDING = "BUILDING",
  READY = "READY",
  FAILED = "FAILED",
}

export enum DatasetLanguage {
  JAVASCRIPT = "JavaScript",
  TYPESCRIPT = "TypeScript",
}

export interface DatasetParams {
  languages: DatasetLanguage[];
  pages: number;
  min_stars: number;
  limit: number;
  lockfiles: string[];
}

export interface DatasetStats {
  search_results: number;
  candidates: number;
  probed: number;
  selected: number;
  rejected: {
    repo_gone: number;
    duplicate_canonical: number;
    fork_or_archived: number;
    no_branch: number;
    no_package_json: number;
    no_lockfile: number;
  };
}

export const DatasetStatusLabels: Record<DatasetStatus, string> = {
  [DatasetStatus.BUILDING]: "Building",
  [DatasetStatus.READY]: "Ready",
  [DatasetStatus.FAILED]: "Failed",
};

export const DatasetStatusTones: Record<DatasetStatus, StatusTone> = {
  [DatasetStatus.BUILDING]: "neutral",
  [DatasetStatus.READY]: "success",
  [DatasetStatus.FAILED]: "danger",
};

/** Why probed candidates were left out, in the order the builder checks. */
export const DatasetRejectionLabels: Record<
  keyof DatasetStats["rejected"],
  string
> = {
  repo_gone: "Gone or inaccessible",
  duplicate_canonical: "Renamed duplicate",
  fork_or_archived: "Fork or archived",
  no_branch: "No default branch",
  no_package_json: "No root package.json",
  no_lockfile: "No root lockfile",
};

export class Dataset {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  name!: string;

  @IsEnum(DatasetStatus)
  status!: DatasetStatus;

  @IsNotEmpty()
  params!: DatasetParams;

  @IsOptional()
  stats!: DatasetStats | null;

  @IsOptional()
  @IsString()
  error!: string | null;

  @IsInt()
  entry_count!: number;

  @IsOptional()
  @IsString()
  integration_id!: string | null;

  @IsOptional()
  @IsString()
  created_by_name!: string | null;

  @IsNotEmpty()
  @Type(() => Date)
  created_on!: Date;

  @IsOptional()
  @Type(() => Date)
  built_on!: Date | null;
}

export class DatasetEntry {
  @IsNotEmpty()
  id!: string;

  @IsInt()
  rank!: number;

  @IsNotEmpty()
  full_name!: string;

  @IsString()
  owner!: string;

  @IsString()
  repo!: string;

  @IsNotEmpty()
  git_url!: string;

  @IsString()
  default_branch!: string;

  @IsInt()
  stars!: number;

  @IsOptional()
  @IsString()
  language!: string | null;

  @IsArray()
  lockfiles!: string[];
}

export interface CreateDatasetRequest {
  name: string;
  integration_id: string;
  limit?: number;
  languages?: DatasetLanguage[];
  pages?: number;
  min_stars?: number;
}
