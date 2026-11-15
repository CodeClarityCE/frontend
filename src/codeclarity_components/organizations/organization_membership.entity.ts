import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from "class-validator";

import { MemberRole } from "./organization.entity";

/** A user as the API nests it in a membership. */
export class MembershipUser {
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

  @IsOptional()
  avatar_url?: string | null;
}

/** Another member's role and join date, as listed on an organisation. */
export class MembershipSummary {
  @IsEnum(MemberRole)
  role!: MemberRole;

  @IsDateString()
  joined_on!: string;
}

/** An organisation as the API nests it in a membership. */
export class MembershipOrganization {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  name!: string;

  @IsDefined()
  description!: string;

  @IsNotEmpty()
  color_scheme!: string;

  @IsDateString()
  created_on!: string;

  @IsBoolean()
  personal!: boolean;

  @IsOptional()
  @IsBoolean()
  auto_resolve_tickets?: boolean;

  /** Every membership of the organisation; only GET /org includes it. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MembershipSummary)
  organizationMemberships?: MembershipSummary[];
}

/** A user's membership of an organisation, as GET /org and the members endpoint return it. */
export class OrganizationMembership {
  @IsEnum(MemberRole)
  role!: MemberRole;

  @IsDateString()
  joined_on!: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => MembershipUser)
  user!: MembershipUser;

  @IsDefined()
  @ValidateNested()
  @Type(() => MembershipOrganization)
  organization!: MembershipOrganization;
}
