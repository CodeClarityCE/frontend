import { IsBoolean, IsDate, IsDefined, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { IntegrationProvider } from './Integrations';
import { Analysis } from './Analysis';
import { Type } from 'class-transformer';
import { TeamMember } from './Organization';

export class Project {
    @IsNotEmpty()
    id!: string;

    @IsNotEmpty()
    name!: string;

    @IsNotEmpty()
    description!: string;

    @IsNotEmpty()
    integration_id!: string;

    @IsDefined()
    @IsEnum(IntegrationProvider)
    type!: IntegrationProvider;

    @IsNotEmpty()
    url!: string;

    @IsOptional()
    @Type(() => Array<Analysis>)
    analyses?: Array<Analysis>;

    @IsNotEmpty()
    upload_id!: string;

    @IsDate()
    @Type(() => Date)
    imported_on!: Date;

    @IsOptional()
    @Type(() => TeamMember)
    imported_by?: TeamMember;

    @IsNotEmpty()
    organization_id!: string;
}

export class Repository {
    @IsNotEmpty()
    id!: string;

    @IsNotEmpty()
    url!: string;

    @IsNotEmpty()
    default_branch!: string;

    @IsNotEmpty()
    visibility!: string;

    @IsNotEmpty()
    fully_qualified_name!: string;

    @IsNotEmpty()
    description!: string;

    @IsDate()
    @Type(() => Date)
    created_at!: Date;

    @IsBoolean()
    imported_already!: boolean;

    @IsNotEmpty()
    integration_id!: string;
}
