import { Type } from "class-transformer";
import { IsDate, IsDefined, IsEnum, IsNotEmpty } from "class-validator";

import { Analyzer } from "../organizations/analyzers/Analyzer";

// Copy of the API's AnalysisStatus in api/src/base_modules/analyses/analysis.entity.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
export enum AnalysisStatus {
  REQUESTED = "requested",
  TRIGGERED = "triggered",
  STARTED = "started",
  FINISHED = "finished",
  COMPLETED = "completed",
  FAILED = "failed",
  FAILURE = "failure",
  SUCCESS = "success",
  CANCELLED = "cancelled",
  UPDATING_DB = "updating_db",
  ONGOING = "ongoing",
  SKIPPED = "skipped",
}

export class Analysis {
  @IsNotEmpty()
  id!: string;

  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  @IsNotEmpty()
  @Type(() => Analyzer)
  analyzer!: Analyzer;

  // @IsOptional()
  // @Type(() => TeamMember)
  // created_by?: TeamMember;

  // @IsDefined()
  // config!: { [key: string]: { [key: string]: any } };

  // @IsNumber()
  // stage!: number;

  @IsEnum(AnalysisStatus)
  status!: AnalysisStatus;

  // Why the analysis failed, when it did
  failure_reason?: string | null;

  @IsDefined()
  steps!: AnalysisStage[][];

  // @IsOptional()
  // @Type(() => Date)
  // started_on?: Date;

  // @IsOptional()
  // @Type(() => Date)
  // ended_on?: Date;

  @IsNotEmpty()
  branch!: string;

  // @IsOptional()
  // @IsNotEmpty()
  // tag?: string;

  // @IsOptional()
  // @IsNotEmpty()
  // commit_hash?: string;

  // @IsNotEmpty()
  // project_id!: string;

  // @IsNotEmpty()
  // organization_id!: string;

  // Scheduling fields
  schedule_type?: "once" | "daily" | "weekly";

  @IsDate()
  @Type(() => Date)
  next_scheduled_run?: Date;

  is_active?: boolean;
}

export class StageBase {
  Name!: string;
  Version!: string;
}

export class Stage extends StageBase {
  config!: Record<string, unknown>;
  persistant_config!: Record<string, unknown>;
}

export class AnalysisStage extends StageBase {
  Status!: AnalysisStatus;
  Result: Record<string, unknown> | string | undefined;
  Started_on?: Date;
  Ended_on?: Date;
}

// Why the dispatcher skipped this plugin, or an empty string
export function stageSkipReason(stage: AnalysisStage): string {
  const result = stage.Result;
  if (typeof result !== "object" || result === null) return "";
  return typeof result.skip_reason === "string" ? result.skip_reason : "";
}

// A project folder an SBOM step found but did not analyse, and why
export interface SkippedFolder {
  path: string;
  reason: string;
}

// The folders every step of the analysis skipped, in step order
export function analysisSkippedFolders(analysis: Analysis): SkippedFolder[] {
  const folders: SkippedFolder[] = [];
  for (const stage of analysis.steps ?? []) {
    for (const step of stage) {
      const result = step.Result;
      if (typeof result !== "object" || result === null) continue;
      const skipped = result.skipped_folders;
      if (!Array.isArray(skipped)) continue;
      for (const folder of skipped as unknown[]) {
        if (typeof folder !== "object" || folder === null) continue;
        const { path, reason } = folder as Record<string, unknown>;
        if (typeof path === "string" && typeof reason === "string") {
          folders.push({ path, reason });
        }
      }
    }
  }
  return folders;
}
