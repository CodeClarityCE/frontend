import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { TeamMember } from "../organization.entity";

export enum ActionSeverity {
  Critical = 3,
  High = 2,
  Medium = 1,
  Low = 0,
}

export enum ActionClassType {
  Project = "Project",
  Analyzer = "Analyzer",
  Analysis = "Analysis",
  Organization = "Organization",
}

export enum ActionType {
  ProjectCreate = "ProjectCreate",
  ProjectUpdate = "ProjectUpdate",
  ProjectDelete = "ProjectDelete",
  AnalyzerCreate = "AnalyzerCreate",
  AnalyzerUpdate = "AnalyzerUpdate",
  AnalyzerDelete = "AnalyzerDelete",
  OrganizationUserLeft = "OrganizationUserLeft",
  OrganizationMembershipRevoked = "OrganizationMembershipRevoked",
  OrganizationMemberJoined = "OrganizationMemberJoined",
  OrganizationMemberInvited = "OrganizationMemberInvited",
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
