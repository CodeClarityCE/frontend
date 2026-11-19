import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsOptional } from "class-validator";

import { TeamMember } from "../organization.entity";

// Copy of the API's ActionSeverity in api/src/base_modules/organizations/log/orgAuditLog.types.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
export enum ActionSeverity {
  Critical = 3,
  High = 2,
  Medium = 1,
  Low = 0,
}

// Copy of the API's ActionClassType in api/src/base_modules/organizations/log/orgAuditLog.types.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
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

  @IsNotEmpty()
  blame_on_email!: string;

  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  // @IsNotEmpty()
  // organization_id!: string;
}
