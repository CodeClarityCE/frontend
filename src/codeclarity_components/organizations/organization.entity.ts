import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsDateString,
    IsDefined,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional
} from 'class-validator';
import type { Project } from '../projects/project.entity';
import type { OrganizationMembership } from './organization_membership.entity';

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

    @IsNotEmpty()
    role!: MemberRole;

    @IsDefined()
    @IsNumber()
    number_of_members!: number;

    organizationMemberships!: OrganizationMembership[];

    @IsDateString()
    joined_on!: Date;
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
    integrations!: any[];
}

export enum MemberRole {
    OWNER = 0,
    ADMIN = 1,
    MODERATOR = 2,
    USER = 3
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

export enum MemberRoleOrdering {
    'owner' = 0,
    'admin' = 1,
    'moderator' = 2,
    'user' = 3
}

export class TeamMemberShip {
    @IsNotEmpty()
    id!: string;

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

    @IsNotEmpty()
    organization_id!: string;

    @IsNotEmpty()
    user_id!: string;
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

export function isMemberRoleGreaterThan(memberRole1: MemberRole, memberRole2: MemberRole) {
    return memberRole1 < memberRole2;
}

export function isMemberRoleGreaterOrEqualTo(memberRole1: MemberRole, memberRole2: MemberRole) {
    return memberRole1 <= memberRole2;
}

export function isMemberRoleEqualThan(memberRole1: MemberRole, memberRole2: MemberRole) {
    return memberRole1 == memberRole2;
}

export function isMemberRoleLessThan(memberRole1: MemberRole, memberRole2: MemberRole) {
    return memberRole1 > memberRole2;
}

export function isMemberRoleLessOrEqualTo(memberRole1: MemberRole, memberRole2: MemberRole) {
    return memberRole1 >= memberRole2;
}
