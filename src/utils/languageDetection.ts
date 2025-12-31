import {
  type Analysis,
  AnalysisStatus,
} from "@/codeclarity_components/analyses/analysis.entity";
import type { Result } from "@/codeclarity_components/results/result.entity";
import { ResultsRepository } from "@/codeclarity_components/results/results.repository";

import type { DetectedLanguage } from "./ecosystem-shared";

// Re-export DetectedLanguage for components that depend on it
export type { DetectedLanguage };

export const SUPPORTED_LANGUAGES: Record<string, DetectedLanguage> = {
  javascript: {
    name: "JavaScript",
    icon: "devicon:javascript",
    color: "#F7DF1E",
  },
  php: {
    name: "PHP",
    icon: "devicon:php",
    color: "#777BB4",
  },
};

export class LanguageDetectionService {
  private resultsRepository: ResultsRepository;

  constructor() {
    // Initialize results repository for API calls
    this.resultsRepository = new ResultsRepository();
  }

  /**
   * Tries to detect a language by checking if its SBOM has actual dependencies
   */
  private async tryDetectLanguage(
    orgId: string,
    projectId: string,
    analysisId: string,
    sbomType: "js-sbom" | "php-sbom",
    bearerToken: string,
  ): Promise<DetectedLanguage | null> {
    try {
      const result = await this.resultsRepository.getResultByType({
        orgId,
        projectId,
        analysisId,
        type: sbomType,
        bearerToken,
        handleBusinessErrors: true,
      });
      if (this.hasActualDependencies(result.data)) {
        const langKey = sbomType === "js-sbom" ? "javascript" : "php";
        return SUPPORTED_LANGUAGES[langKey] ?? null;
      }
    } catch {
      // No SBOM results found, language not detected
    }
    return null;
  }

  /**
   * Gets the list of SBOM plugins that were successfully executed in the analysis
   */
  private getExecutedSbomPlugins(analysis: Analysis): string[] {
    const plugins: string[] = [];
    if (!analysis.steps) return plugins;

    for (const step of analysis.steps) {
      for (const stage of step) {
        if (stage.Status === AnalysisStatus.SUCCESS) {
          if (stage.Name === "js-sbom" || stage.Name === "php-sbom") {
            plugins.push(stage.Name);
          }
        }
      }
    }
    return plugins;
  }

  /**
   * Detects languages in a project by checking which SBOM plugins produced results
   * with actual dependencies (not just empty results)
   */
  async detectProjectLanguages(
    orgId: string,
    projectId: string,
    analysis: Analysis,
    bearerToken: string,
  ): Promise<DetectedLanguage[]> {
    const detectedLanguages: DetectedLanguage[] = [];

    // First, check which SBOM plugins were actually executed
    const executedPlugins = this.getExecutedSbomPlugins(analysis);

    try {
      // Check for JavaScript only if js-sbom was executed
      if (executedPlugins.includes("js-sbom")) {
        const jsLang = await this.tryDetectLanguage(
          orgId,
          projectId,
          analysis.id,
          "js-sbom",
          bearerToken,
        );
        if (jsLang) detectedLanguages.push(jsLang);
      }

      // Check for PHP only if php-sbom was executed
      if (executedPlugins.includes("php-sbom")) {
        const phpLang = await this.tryDetectLanguage(
          orgId,
          projectId,
          analysis.id,
          "php-sbom",
          bearerToken,
        );
        if (phpLang) detectedLanguages.push(phpLang);
      }
    } catch (error) {
      console.error("Error detecting project languages:", error);
    }

    return detectedLanguages;
  }

  /**
   * Checks if an SBOM result contains actual dependencies
   */
  private hasActualDependencies(result: Result): boolean {
    if (!result?.result) return false;

    const sbom = result.result as {
      workspaces?: Record<string, { dependencies?: Record<string, unknown> }>;
    };
    if (!sbom.workspaces) return false;

    // Check if any workspace has dependencies
    for (const workspace of Object.values(sbom.workspaces)) {
      if (
        workspace.dependencies &&
        Object.keys(workspace.dependencies).length > 0
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gets languages from a completed analysis
   */

  getLanguagesFromAnalysis(_analysis: Analysis): DetectedLanguage[] {
    // This method can be extended to check analysis metadata if language detection
    // information is stored in the analysis object itself in the future
    const detectedLanguages: DetectedLanguage[] = [];

    // For now, we'll need to make API calls to determine languages
    // This is a placeholder that could be optimized by storing language
    // detection results in the analysis object

    return detectedLanguages;
  }

  /**
   * Gets the most recent successful analysis for language detection
   */
  getMostRecentCompletedAnalysis(analyses: Analysis[]): Analysis | null {
    if (analyses?.length === 0) return null;

    const completedAnalyses = analyses.filter(
      (analysis) =>
        analysis.status === AnalysisStatus.COMPLETED ||
        analysis.status === AnalysisStatus.FINISHED,
    );

    if (completedAnalyses.length === 0) return null;

    return (
      completedAnalyses.sort(
        (a, b) =>
          new Date(b.created_on).getTime() - new Date(a.created_on).getTime(),
      )[0] ?? null
    );
  }
}
