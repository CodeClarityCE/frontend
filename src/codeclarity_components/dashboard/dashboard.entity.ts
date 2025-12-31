import { Type } from "class-transformer";
import {
  IsDefined,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from "class-validator";

import { IntegrationProvider } from "../organizations/integrations/Integrations";

export enum Trend {
  UP = "UP",
  DOWN = "DOWN",
  EQUAL = "EQUAL",
}

export interface StatsTrend {
  trend: Trend;
  diff?: number;
}

export class ProjectGroup {
  @IsString()
  id!: string;
  @IsString()
  name!: string;
  @IsEnum(IntegrationProvider)
  provider!: IntegrationProvider;
  @IsUrl()
  url!: string;
}

export class LicenseDist {
  [licenseId: string]: number;
}

export enum ProjectGradeClass {
  A_PLUS = "A+",
  A = "A",
  B_PLUS = "B+",
  B = "B",
  C_PLUS = "C+",
  C = "C",
  D_PLUS = "D+",
  D = "D",
}

export class ProjectGrade {
  @IsNumber()
  score!: number;
  @IsEnum(ProjectGradeClass)
  class!: ProjectGradeClass;
}

export class ProjectQuickStats {
  @IsDefined()
  project!: ProjectGroup;
  @IsNumber()
  nmb_license_compliance_violations!: number;
  @IsNumber()
  nmb_vulnerabilities!: number;
  @IsNumber()
  nmb_deprecated!: number;
  @IsNumber()
  nmb_outdated!: number;
  @IsNumber()
  sum_severity!: number;
  @IsNumber()
  avg_severity!: number;
  @IsDefined()
  grade!: ProjectGrade;
}

export class AttackVectorDist {
  @IsString()
  attack_vector!: string;
  @IsNumber()
  count!: number;
}

export class QuickStats {
  @IsNumber()
  max_grade!: ProjectGrade;
  @IsDefined()
  max_grade_trend!: StatsTrend;
  @IsNumber()
  nmb_deprecated!: number;
  @IsDefined()
  nmb_deprecated_trend!: StatsTrend;
  @IsNumber()
  nmb_projects!: number;
  @IsOptional()
  @IsString()
  owasp_top_10?: string;
  @IsOptional()
  @IsString()
  most_affected_cia?: string;
}

export class LatestVulns {
  @IsDefined()
  // @Type(() => LatestVuln)
  vulns!: Record<string, LatestVulnInfo>;
  @IsDefined()
  @Type(() => SeverityClassCount)
  severity_count!: SeverityClassCount[];
}

export class LatestVulnInfo {
  @IsOptional()
  @IsNumber()
  severity?: number;
  @IsOptional()
  @IsString()
  severity_class?: string;
  @IsOptional()
  @IsString()
  cwe?: string;
  @IsString()
  cwe_name!: string;
}

export class SeverityClassCount {
  severity_class!: string | null;
  @IsNumber()
  count!: number;
}
export class CIAImpact {
  @IsString()
  cia!: string;
  @IsNumber()
  impact!: number;
}

export class WeekNumberGroup {
  @IsNumber()
  week!: number;
  @IsNumber()
  year!: number;
}

export class SeverityInfoByWeek {
  @IsDefined()
  @Type(() => WeekNumberGroup)
  week_number!: WeekNumberGroup;
  @IsNumber()
  summed_severity!: number;
  @IsNumber()
  nmb_critical!: number;
  @IsNumber()
  nmb_high!: number;
  @IsNumber()
  nmb_medium!: number;
  @IsNumber()
  nmb_low!: number;
  @IsNumber()
  nmb_none!: number;
}
