import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsOptional } from "class-validator";

// Copy of the API's OrganizationTokenScope in api/src/base_modules/organizations/tokens/organization-token.types.ts.
// The umbrella type-sync check (scripts/type-sync) fails CI when a value is missing.
export enum OrganizationTokenScope {
  READ = "read",
  ANALYZE = "analyze",
}

export interface OrganizationTokenCreate {
  name: string;
  scope: OrganizationTokenScope;
  expires_on: string;
}

/** A new token as the API returns it once, with its secret. */
export class CreatedOrganizationToken {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  name!: string;

  @IsEnum(OrganizationTokenScope)
  scope!: OrganizationTokenScope;

  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  @IsDate()
  @Type(() => Date)
  expires_on!: Date;

  @IsNotEmpty()
  secret!: string;
}

/** A token as the list shows it: never its secret. */
export class OrganizationTokenSummary {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  name!: string;

  @IsEnum(OrganizationTokenScope)
  scope!: OrganizationTokenScope;

  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  @IsDate()
  @Type(() => Date)
  expires_on!: Date;

  // Null once the creator deleted their account.
  @IsOptional()
  created_by_email!: string | null;
}
