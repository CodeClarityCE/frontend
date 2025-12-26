import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from "class-validator";
import { SocialProvider } from "../organizations/integrations/Integrations";
import { Organization } from "../organizations/organization.entity";

export class AuthenticatedUser {
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

  @IsNotEmpty()
  @Type(() => Organization)
  default_org!: Organization;

  @IsNotEmpty()
  activated!: boolean;

  // @IsNotEmpty()
  // personal_org!: string;

  @IsBoolean()
  social!: boolean;

  @IsOptional()
  @IsEnum(SocialProvider)
  social_register_type?: SocialProvider;

  @IsBoolean()
  setup_done!: boolean;

  @IsOptional()
  @IsNotEmpty()
  avatar_url?: string;

  @IsDate()
  @Type(() => Date)
  created_on!: Date;
}
