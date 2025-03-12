import { IsDateString, IsNotEmpty } from 'class-validator';
import type { Organization, TeamMember, MemberRole } from './organization.entity';

export class OrganizationMembership {
    @IsDateString()
    joined_on!: Date;

    @IsNotEmpty()
    organization!: Organization;

    user!: TeamMember;
    role!: MemberRole
}
