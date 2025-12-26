import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsDate,
    IsDefined,
    IsEnum,
    IsNotEmpty,
    IsOptional
} from 'class-validator';

export enum LicensePolicyType {
    WHITELIST = 'WHITELIST',
    BLACKLIST = 'BLACKLIST'
}

export enum PolicyType {
    LICENSE_POLICY = 'LICENSE_POLICY',
    DEP_UPGRADE_POLICY = 'DEP_UPGRADE_POLICY'
}

export class LicensePolicy {
    @IsNotEmpty()
    id!: string;

    @IsNotEmpty()
    name!: string;

    @IsNotEmpty()
    description!: string;

    @IsDefined()
    @IsEnum(LicensePolicyType)
    policy_type!: LicensePolicyType;

    @IsBoolean()
    default!: boolean;

    @IsOptional()
    created_by?: string;

    @IsDate()
    @Type(() => Date)
    created_on!: Date;

    @IsNotEmpty()
    @IsArray()
    content!: string[];
}
