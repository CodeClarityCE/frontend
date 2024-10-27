import { Type } from 'class-transformer';
import { IsDate, IsDefined, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { MemberRole, TeamMember } from './Organization';

export class Invitation {
    @IsNotEmpty()
    id!: string;

    @IsDate()
    @Type(() => Date)
    created_on!: Date;

    @IsOptional()
    @Type(() => TeamMember)
    created_by?: TeamMember;

    @IsEnum(MemberRole)
    role!: MemberRole;

    @IsNotEmpty()
    organization_id!: string;

    @IsNotEmpty()
    user_email!: string;

    @IsDefined()
    @Type(() => Date)
    ttl!: Date;
}
