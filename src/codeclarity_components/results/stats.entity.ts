import { IsNotEmpty, IsNumber, IsString } from "class-validator";
export class SbomStats {
  @IsNotEmpty()
  @IsNumber()
  number_of_dev_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_non_dev_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_bundled_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_optional_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_peer_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_direct_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_transitive_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_both_direct_transitive_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_deprecated_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_unlicensed_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_outdated_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  average_dependency_age!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_dev_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_non_dev_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_bundled_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_optional_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_peer_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_direct_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_transitive_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_deprecated_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_unlicensed_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_outdated_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  number_of_dependencies_diff!: number;

  @IsNotEmpty()
  @IsNumber()
  average_dependency_age_diff!: number;

  @IsNotEmpty()
  @IsString()
  node_min_supported_version!: string;

  @IsNotEmpty()
  @IsString()
  node_max_supported_version!: string;
}

export class PatchingStats {
  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_vulnerabilities!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_issues!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_vulnerable_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_direct_vulnerabilities!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_transitive_vulnerabilities!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_mean_severity!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_max_severity!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_critical!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_high!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_medium!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_low!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_number_of_none!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_overall_confidentiality_impact!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_overall_integrity_impact!: number;

  @IsNotEmpty()
  @IsNumber()
  before_patch_overall_availability_impact!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_vulnerabilities!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_issues!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_vulnerable_dependencies!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_direct_vulnerabilities!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_transitive_vulnerabilities!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_mean_severity!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_max_severity!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_critical!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_high!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_medium!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_low!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_number_of_none!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_overall_confidentiality_impact!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_overall_integrity_impact!: number;

  @IsNotEmpty()
  @IsNumber()
  after_patch_overall_availability_impact!: number;
}

export class AnalysisStats {
  number_of_issues!: number;
  number_of_vulnerabilities!: number;
  number_of_vulnerable_dependencies!: number;
  number_of_direct_vulnerabilities!: number;
  number_of_transitive_vulnerabilities!: number;

  mean_severity!: number;
  max_severity!: number;

  number_of_owasp_top_10_2021_a1!: number;
  number_of_owasp_top_10_2021_a2!: number;
  number_of_owasp_top_10_2021_a3!: number;
  number_of_owasp_top_10_2021_a4!: number;
  number_of_owasp_top_10_2021_a5!: number;
  number_of_owasp_top_10_2021_a6!: number;
  number_of_owasp_top_10_2021_a7!: number;
  number_of_owasp_top_10_2021_a8!: number;
  number_of_owasp_top_10_2021_a9!: number;
  number_of_owasp_top_10_2021_a10!: number;

  number_of_critical!: number;
  number_of_high!: number;
  number_of_medium!: number;
  number_of_low!: number;
  number_of_none!: number;

  mean_confidentiality_impact!: number;
  mean_integrity_impact!: number;
  mean_availability_impact!: number;

  number_of_vulnerabilities_diff!: number;
  number_of_vulnerable_dependencies_diff!: number;
  number_of_direct_vulnerabilities_diff!: number;
  number_of_transitive_vulnerabilities_diff!: number;

  mean_severity_diff!: number;
  max_severity_diff!: number;

  number_of_owasp_top_10_2021_a1_diff!: number;
  number_of_owasp_top_10_2021_a2_diff!: number;
  number_of_owasp_top_10_2021_a3_diff!: number;
  number_of_owasp_top_10_2021_a4_diff!: number;
  number_of_owasp_top_10_2021_a5_diff!: number;
  number_of_owasp_top_10_2021_a6_diff!: number;
  number_of_owasp_top_10_2021_a7_diff!: number;
  number_of_owasp_top_10_2021_a8_diff!: number;
  number_of_owasp_top_10_2021_a9_diff!: number;
  number_of_owasp_top_10_2021_a10_diff!: number;

  number_of_critical_diff!: number;
  number_of_high_diff!: number;
  number_of_medium_diff!: number;
  number_of_low_diff!: number;
  number_of_none_diff!: number;

  mean_confidentiality_impact_diff!: number;
  mean_integrity_impact_diff!: number;
  mean_availability_impact_diff!: number;
}
