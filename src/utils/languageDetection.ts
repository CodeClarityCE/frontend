import {
  AnalysisStatus,
  type Analysis,
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

    try {
      // Check for JavaScript by looking for js-sbom results with actual dependencies
      try {
        const jsResult = await this.resultsRepository.getResultByType({
          orgId,
          projectId,
          analysisId: analysis.id,
          type: "js-sbom",
          bearerToken,
          handleBusinessErrors: true,
        });
        if (this.hasActualDependencies(jsResult.data)) {
          const jsLang = SUPPORTED_LANGUAGES.javascript;
          if (jsLang) detectedLanguages.push(jsLang);
        }
      } catch {
        // No js-sbom results found, JavaScript not detected
      }

      // Check for PHP by looking for php-sbom results with actual dependencies
      try {
        const phpResult = await this.resultsRepository.getResultByType({
          orgId,
          projectId,
          analysisId: analysis.id,
          type: "php-sbom",
          bearerToken,
          handleBusinessErrors: true,
        });
        if (this.hasActualDependencies(phpResult.data)) {
          const phpLang = SUPPORTED_LANGUAGES.php;
          if (phpLang) detectedLanguages.push(phpLang);
        }
      } catch {
        // No php-sbom results found, PHP not detected
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
