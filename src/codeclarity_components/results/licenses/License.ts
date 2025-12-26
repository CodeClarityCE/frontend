import { IsBoolean, IsNotEmpty, IsString } from "class-validator";
export class License {
  @IsNotEmpty()
  deps_using_license!: string[];

  @IsString()
  description!: string;

  @IsString()
  id!: string;

  @IsString()
  licenseId!: string;

  @IsString()
  license_category!: string;

  @IsBoolean()
  license_compliance_violation!: boolean;

  license_properties!: {
    permissions: string[];
    conditions: string[];
    limitations: string[];
    usage: string;
  };

  @IsString()
  name!: string;

  references!: string[];

  unable_to_infer!: boolean;

  _key!: string;
}
