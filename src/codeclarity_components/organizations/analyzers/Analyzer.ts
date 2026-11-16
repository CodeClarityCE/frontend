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
  | { state: "off"; components: string[]; message: string }
  | { state: "down"; plugins: string[]; message: string };

export type Unavailable = Exclude<AnalyzerAvailability, { state: "available" }>;

/** Whether the analyzer cannot run on this instance right now. */
export function isUnavailable(
  availability?: AnalyzerAvailability,
): availability is Unavailable {
  return availability !== undefined && availability.state !== "available";
}

/**
 * The text shown for an analyzer that cannot run: "Temporarily unavailable"
 * while a plugin is down, "Unavailable" while a component is turned off.
 */
export function unavailableLabel(availability?: AnalyzerAvailability): string {
  if (!isUnavailable(availability)) return "";
  return availability.state === "down"
    ? `Temporarily unavailable: ${availability.message}`
    : `Unavailable: ${availability.message}`;
}

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
