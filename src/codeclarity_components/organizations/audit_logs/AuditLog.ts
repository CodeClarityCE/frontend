import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsOptional } from "class-validator";

import { TeamMember } from "../organization.entity";

// Copy of the API's ActionSeverity in api/src/base_modules/organizations/log/orgAuditLog.types.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
/** @public type-sync copy of an API enum: every API value stays */
export enum ActionSeverity {
  Critical = 3,
  High = 2,
  Medium = 1,
  Low = 0,
}

// Copy of the API's ActionClassType in api/src/base_modules/organizations/log/orgAuditLog.types.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
/** @public type-sync copy of an API enum: every API value stays */
export enum ActionClassType {
  Project = "Project",
  Analyzer = "Analyzer",
  Analysis = "Analysis",
  Organization = "Organization",
  // Spelling matches the value the API sends.
  Unkown = "Unkown",
}

// Copy of the API's ActionType in api/src/base_modules/organizations/log/orgAuditLog.types.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
/** @public type-sync copy of an API enum: every API value stays */
export enum ActionType {
  ProjectCreate = "ProjectCreate",
  ProjectUpdate = "ProjectUpdate",
  ProjectDelete = "ProjectDelete",
  AnalyzerCreate = "AnalyzerCreate",
  AnalyzerUpdate = "AnalyzerUpdate",
  AnalyzerDelete = "AnalyzerDelete",
  AnalysisStarted = "AnalysisStarted",
  AnalysisDeleted = "AnalysisDeleted",
  AnalysisFailed = "AnalysisFailed",
  OrganizationUserLeft = "OrganizationUserLeft",
  OrganizationCreated = "OrganizationCreated",
  OrganizationMembershipRevoked = "OrganizationMembershipRevoked",
  OrganizationInvitationRevoked = "OrganizationInvitationRevoked",
  OrganizationMemberJoined = "OrganizationMemberJoined",
  OrganizationMemberInvited = "OrganizationMemberInvited",
  OrganizationIntegrationAdded = "OrganizationIntegrationAdded",
  OrganizationIntegrationUpdated = "OrganizationIntegrationUpdated",
  OrganizationIntegrationDeleted = "OrganizationIntegrationDeleted",
  OrganizationTokenCreated = "OrganizationTokenCreated",
  OrganizationTokenUsed = "OrganizationTokenUsed",
  OrganizationTokenRevoked = "OrganizationTokenRevoked",
}

export class AuditLog {
  @IsNotEmpty()
  id!: string;

  @IsEnum(ActionSeverity)
  action_severity!: ActionSeverity;

  @IsEnum(ActionClassType)
  action_class!: ActionClassType;

  @IsEnum(ActionType)
  action!: ActionType;

  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @Type(() => TeamMember)
  blame_on?: TeamMember;

  // Null when an Organization token is the actor.
  @IsOptional()
  blame_on_email?: string | null;

  @IsOptional()
  blame_on_token_id?: string | null;

  @IsOptional()
  blame_on_token_name?: string | null;

  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  // @IsNotEmpty()
  // organization_id!: string;
}
