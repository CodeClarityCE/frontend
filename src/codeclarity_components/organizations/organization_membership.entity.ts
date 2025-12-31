import { IsDateString, IsNotEmpty } from "class-validator";

import type {
  MemberRole,
  Organization,
  TeamMember,
} from "./organization.entity";

export class OrganizationMembership {
  @IsDateString()
  joined_on!: Date;

  @IsNotEmpty()
  organization!: Organization;

  user!: TeamMember;
  role!: MemberRole;
}
