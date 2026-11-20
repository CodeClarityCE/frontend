import { IsNumber, IsString } from "class-validator";

export class LicenseDist {
  [licenseId: string]: number;
}

export class CIAImpact {
  @IsString()
  cia!: string;
  @IsNumber()
  impact!: number;
}
