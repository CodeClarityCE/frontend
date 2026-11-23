import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDateString,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from "class-validator";

import type { Project } from "../projects/project.entity";

import type { MembershipSummary } from "./organization_membership.entity";

export class Organization {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  color_scheme!: string;

  @IsNotEmpty()
  description!: string;

  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  @IsOptional()
  @Type(() => TeamMember)
  created_by?: TeamMember;

  @IsOptional()
  @Type(() => TeamMember)
  added_by?: TeamMember;

  @IsBoolean()
  personal!: boolean;

  @IsOptional()
  @IsBoolean()
  auto_resolve_tickets?: boolean;

  @IsOptional()
  @IsNumber()
  freshness_threshold_days?: number;

  @IsOptional()
  @IsBoolean()
  service_level_targets_enabled?: boolean;

  @IsOptional()
  service_level_targets?: ServiceLevelTargetDays;

  /** The days the API suggests to start from */
  @IsOptional()
  suggested_service_level_targets?: ServiceLevelTargetDays;

  @IsNotEmpty()
  role!: MemberRole;

  @IsDefined()
  @IsNumber()
  number_of_members!: number;

  organizationMemberships!: MembershipSummary[];

  @IsDateString()
  joined_on!: Date;
}

/** Days allowed per severity; null means no target for that severity. */
export interface ServiceLevelTargetDays {
  critical: number | null;
  high: number | null;
  medium: number | null;
  low: number | null;
}

export interface Integration {
  id?: string;
  provider?: string;
  [key: string]: unknown;
}

export class OrganizationMetaData {
  @IsNotEmpty()
  id!: string;
  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  @IsArray()
  projects!: Project[];

  @IsArray()
  integrations!: Integration[];
}

// Copy of the API's MemberRole in api/src/base_modules/organizations/memberships/organization.memberships.entity.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
/** @public type-sync copy of an API enum: every API value stays */
export enum MemberRole {
  OWNER = 0,
  ADMIN = 1,
  MODERATOR = 2,
  USER = 3,
}

export class OrganizationInfoForInvitee {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  description!: string;

  @IsNotEmpty()
  color_scheme!: string;

  @IsDefined()
  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  @IsOptional()
  @Type(() => TeamMember)
  created_by?: TeamMember;

  @IsOptional()
  @Type(() => TeamMember)
  invite_created_by?: TeamMember;

  @IsDate()
  @Type(() => Date)
  invite_created_on!: Date;

  @IsNumber()
  number_of_members!: number;

  @IsEnum(MemberRole)
  role!: MemberRole;
}

export class TeamMember {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  first_name!: string;

  @IsNotEmpty()
  last_name!: string;

  @IsNotEmpty()
  handle!: string;

  @IsNotEmpty()
  email!: string;

  @IsEnum(MemberRole)
  role!: MemberRole;

  @IsDate()
  @Type(() => Date)
  added_on!: Date;

  @IsNotEmpty()
  added_by!: string;

  @IsDate()
  @Type(() => Date)
  joined_on!: Date;

  @IsOptional()
  @IsNotEmpty()
  avatar_url?: string;

  @IsNotEmpty()
  organization_id!: string;
}

export function isMemberRoleGreaterThan(
  memberRole1: MemberRole,
  memberRole2: MemberRole,
): boolean {
  return memberRole1 < memberRole2;
}

export function isMemberRoleGreaterOrEqualTo(
  memberRole1: MemberRole,
  memberRole2: MemberRole,
): boolean {
  return memberRole1 <= memberRole2;
}
