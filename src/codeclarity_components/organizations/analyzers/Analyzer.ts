import { Type } from "class-transformer";
import { IsDate, IsDefined, IsNotEmpty, IsOptional } from "class-validator";

import { TeamMember } from "../organization.entity";

export class Analyzer {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  name!: string;

  @IsNotEmpty()
  description!: string;

  @IsDate()
  @Type(() => Date)
  created_on!: Date;

  @IsOptional()
  @Type(() => TeamMember)
  created_by?: TeamMember;

  @IsDefined()
  steps!: Stage[][];

  @IsOptional()
  supported_languages?: string[];

  // Plugins to run for each language
  @IsOptional()
  language_config?: Record<string, { plugins: string[] }>;

  @IsOptional()
  logo?: string;

  // Whether it can run on this instance, and why not
  @IsOptional()
  availability?: AnalyzerAvailability;
}

export type AnalyzerAvailability =
  | { state: "available" }
  | { state: "off"; components: string[]; message: string };

/********************************************/
/*                Other types               */
/********************************************/

export interface StageBase {
  name: string;
  version: string;
}

export interface Stage extends StageBase {
  config: Record<string, unknown>;
  persistant_config: Record<string, unknown>;
}
