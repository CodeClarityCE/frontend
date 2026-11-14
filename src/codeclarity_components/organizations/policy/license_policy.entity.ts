import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";

export enum LicensePolicyType {
  WHITELIST = "WHITELIST",
  BLACKLIST = "BLACKLIST",
}

export enum PolicyType {
  LICENSE_POLICY = "LICENSE_POLICY",
  DEP_UPGRADE_POLICY = "DEP_UPGRADE_POLICY",
  VULNERABILITY_POLICY = "VULNERABILITY_POLICY",
}

// The server does not store the allow or block type, only the policy kind.
export class LicensePolicy {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  name!: string;

  @IsString()
  description!: string;

  @IsDefined()
  @IsEnum(PolicyType)
  policy_type!: PolicyType;

  @IsBoolean()
  default!: boolean;

  // The creator's email, or empty when the server did not load it
  @IsOptional()
  @IsString()
  created_by?: string;

  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  @IsNotEmpty()
  @IsArray()
  content!: string[];
}
