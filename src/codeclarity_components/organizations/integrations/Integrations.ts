import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { GithubTokenType, GitlabTokenType } from './integration_add.http';
import { OptionalDateTransform } from '@/utils/OptionalDate';
import { TeamMember } from '../organization.entity';

export enum IntegrationType {
    VCS = 'VCS'
}

export enum SocialProvider {
    GITHUB = 'GITHUB',
    GITLAB = 'GITLAB'
}

export enum IntegrationProvider {
    GITHUB = 'GITHUB',
    GITLAB = 'GITLAB'
}

export class VCS {
    @IsString()
    id!: string;

    @IsDefined()
    @Type(() => Date)
    added_on!: Date;

    @IsString()
    added_by!: string;

    @IsString()
    service_domain!: string;

    @IsDefined()
    @IsEnum(IntegrationType)
    integration_type!: IntegrationType;

    @IsDefined()
    @IsEnum(IntegrationProvider)
    integration_provider!: IntegrationProvider;

    @IsBoolean()
    invalid!: boolean;

    @OptionalDateTransform('expiry')
    expiry_date?: Date;
}

export abstract class AccessTokenBasedIntegration {
    @IsNotEmpty()
    id!: string;

    @IsDefined()
    @IsEnum(IntegrationType)
    integration_type!: IntegrationType;

    @IsDefined()
    @IsEnum(IntegrationProvider)
    integration_provider!: IntegrationProvider;

    @IsOptional()
    @Type(() => Date)
    expiry_date?: Date;

    @IsBoolean()
    invalid!: boolean;

    @IsNotEmpty()
    service_domain!: string;

    @IsDefined()
    @Type(() => Date)
    added_on!: Date;
}

export class GitlabIntegration extends AccessTokenBasedIntegration {
    @IsNotEmpty()
    service_base_url!: string;

    @IsDefined()
    @IsEnum(GitlabTokenType)
    token_type!: GitlabTokenType;

    @IsOptional()
    @Type(() => TeamMember)
    added_by?: TeamMember;
}

export class GithubIntegration extends AccessTokenBasedIntegration {
    @IsDefined()
    @IsEnum(GithubTokenType)
    token_type!: GithubTokenType;

    @IsOptional()
    @Type(() => TeamMember)
    added_by?: TeamMember;
}
