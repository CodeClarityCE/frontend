/**
 * SBOM Utilities
 * Helper functions for SBOM data processing and calculations
 */

import type { AnalysisStats, SbomStats } from "../../stats.entity";

export interface Dependency {
  name: string;
  version: string;
  newest_release?: string;
  is_direct?: boolean;
  is_direct_count: number;
  prod?: boolean;
  dev?: boolean;
  outdated?: boolean;
  deprecated?: boolean;
}

export interface PackageUpdate {
  name: string;
  currentVersion: string;
  latestVersion: string;
  isDev: boolean;
  isProd: boolean;
}

/**
 * Check if a dependency is direct
 */
export function isDependencyDirect(dependency: Dependency): boolean {
  return dependency.is_direct_count > 0 || !!dependency.is_direct;
}

/**
 * Check if a dependency has an available update
 */
export function hasUpdate(dependency: Dependency): boolean {
  return (
    dependency.outdated ??
    (!!dependency.newest_release &&
      dependency.version !== dependency.newest_release)
  );
}

// An outdated dependency counts for less, so version lag alone stays above the Critical grades
const OUTDATED_WEIGHT = 0.4;

/**
 * Calculate health score from SBOM stats
 */
export function calculateHealthScore(stats: SbomStats): number {
  const total = stats.number_of_dependencies ?? 1;
  if (total <= 0) return 100;

  const outdated = stats.number_of_outdated_dependencies ?? 0;
  const deprecated = stats.number_of_deprecated_dependencies ?? 0;
  const unlicensed = stats.number_of_unlicensed_dependencies ?? 0;

  const issues = outdated * OUTDATED_WEIGHT + deprecated + unlicensed;
  return Math.max(0, Math.round(((total - issues) / total) * 100));
}

/**
 * Count security issues from the vulnerability stats.
 * Returns null when the count is unknown, which must not read as zero.
 */
export function calculateSecurityIssues(
  stats: Pick<AnalysisStats, "number_of_vulnerabilities"> | null,
): number | null {
  return stats?.number_of_vulnerabilities ?? null;
}

/**
 * Filter dependencies that need updates and are direct (actionable)
 */
export function getDirectDependenciesNeedingUpdates(
  dependencies: Dependency[],
): Dependency[] {
  return dependencies.filter((dep) => {
    const isDirect = isDependencyDirect(dep);
    const needsUpdate = hasUpdate(dep);
    return isDirect && needsUpdate;
  });
}

/**
 * Convert dependencies to PackageUpdate format for the modal
 */
export function convertToPackageUpdates(
  dependencies: Dependency[],
): PackageUpdate[] {
  return dependencies.map((dep) => ({
    name: dep.name,
    currentVersion: dep.version,
    latestVersion: dep.newest_release ?? dep.version,
    isDev: dep.dev ?? false,
    isProd: dep.prod ?? false,
  }));
}
