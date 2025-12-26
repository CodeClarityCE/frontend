/**
 * Semantic version comparison utilities
 * Follows semver 2.0.0 specification
 */

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
  build: string[];
}

/**
 * Parse a semantic version string into components
 */
export function parseSemver(version: string): ParsedSemver {
  // Remove leading 'v' if present
  const cleanVersion = version.replace(/^v/, "");

  // Split by '+' to separate build metadata
  const [coreAndPre, ...buildParts] = (cleanVersion ?? "").split("+");

  // Split by '-' to separate prerelease
  const [core, ...prereleaseParts] = (coreAndPre ?? "").split("-");

  // Parse core version (major.minor.patch)
  const [major, minor = "0", patch = "0"] = (core ?? "0.0.0").split(".");

  return {
    major: parseInt(major ?? "0", 10) ?? 0,
    minor: parseInt(minor, 10) ?? 0,
    patch: parseInt(patch, 10) ?? 0,
    prerelease: prereleaseParts,
    build: buildParts,
  };
}

/**
 * Compare two semantic version strings
 * Returns:
 *  -1 if version1 < version2
 *   0 if version1 = version2
 *   1 if version1 > version2
 */
export function compareSemver(version1: string, version2: string): number {
  try {
    const v1 = parseSemver(version1);
    const v2 = parseSemver(version2);

    // Compare major, minor, patch
    const coreComparison = compareCore(v1, v2);
    if (coreComparison !== 0) {
      return coreComparison;
    }

    // Both versions have same major.minor.patch
    // Handle prerelease comparison
    return comparePrerelease(v1.prerelease, v2.prerelease);
  } catch {
    // If parsing fails, fall back to string comparison
    return version1.localeCompare(version2);
  }
}

function compareCore(v1: ParsedSemver, v2: ParsedSemver): number {
  if (v1.major !== v2.major) {
    if (v1.major > v2.major) return 1;
    return -1;
  }
  if (v1.minor !== v2.minor) {
    if (v1.minor > v2.minor) return 1;
    return -1;
  }
  if (v1.patch !== v2.patch) {
    if (v1.patch > v2.patch) return 1;
    return -1;
  }
  return 0;
}

function comparePrerelease(pre1: string[], pre2: string[]): number {
  // When major, minor, and patch are equal, a pre-release version has
  // lower precedence than a normal version
  if (pre1.length === 0 && pre2.length > 0) return 1;
  if (pre1.length > 0 && pre2.length === 0) return -1;
  if (pre1.length === 0 && pre2.length === 0) return 0;

  // Compare each prerelease identifier
  const maxLength = Math.max(pre1.length, pre2.length);
  for (let i = 0; i < maxLength; i++) {
    const a = pre1[i];
    const b = pre2[i];

    // Missing identifier has lower precedence
    if (a === undefined) return -1;
    if (b === undefined) return 1;

    // Compare identifiers
    const result = compareIdentifier(a, b);
    if (result !== 0) return result;
  }

  return 0;
}

function compareIdentifier(a: string, b: string): number {
  const aIsNumeric = /^\d+$/.test(a);
  const bIsNumeric = /^\d+$/.test(b);

  // Numeric identifiers always have lower precedence than non-numeric
  if (aIsNumeric && !bIsNumeric) return -1;
  if (!aIsNumeric && bIsNumeric) return 1;

  // Both numeric - compare as numbers
  if (aIsNumeric && bIsNumeric) {
    const aNum = parseInt(a, 10);
    const bNum = parseInt(b, 10);
    if (aNum > bNum) return 1;
    if (aNum < bNum) return -1;
    return 0;
  }

  // Both non-numeric - compare lexically
  return a.localeCompare(b);
}

/**
 * Check if version1 is greater than version2
 */
export function isGreaterThan(version1: string, version2: string): boolean {
  return compareSemver(version1, version2) > 0;
}

/**
 * Check if version1 is less than version2
 */
export function isLessThan(version1: string, version2: string): boolean {
  return compareSemver(version1, version2) < 0;
}

/**
 * Check if two versions are equal
 */
export function isEqual(version1: string, version2: string): boolean {
  return compareSemver(version1, version2) === 0;
}

/**
 * Sort an array of version strings in ascending order
 */
export function sortVersions(versions: string[], descending = false): string[] {
  return [...versions].sort((a, b) => {
    const result = compareSemver(a, b);
    return descending ? -result : result;
  });
}

/**
 * Get the higher of two versions
 */
export function maxVersion(version1: string, version2: string): string {
  return compareSemver(version1, version2) >= 0 ? version1 : version2;
}

/**
 * Get the lower of two versions
 */
export function minVersion(version1: string, version2: string): string {
  return compareSemver(version1, version2) <= 0 ? version1 : version2;
}

/**
 * Check if a version is a prerelease version
 */
export function isPrerelease(version: string): boolean {
  try {
    const parsed = parseSemver(version);
    return parsed.prerelease.length > 0;
  } catch {
    // Fallback to simple string check if parsing fails
    return version.includes("-");
  }
}

/**
 * Check if a version is a stable release (not a prerelease)
 */
export function isStable(version: string): boolean {
  return !isPrerelease(version);
}

/**
 * Get the prerelease identifiers from a version
 */
export function getPrereleaseIdentifiers(version: string): string[] {
  try {
    const parsed = parseSemver(version);
    return parsed.prerelease;
  } catch {
    return [];
  }
}

/**
 * Check if an upgrade from version1 to version2 should be recommended
 * Returns false for stable-to-prerelease upgrades
 */
export function shouldRecommendUpgrade(
  currentVersion: string,
  newVersion: string,
): boolean {
  // Always recommend if the new version is greater
  if (!isGreaterThan(newVersion, currentVersion)) {
    return false;
  }

  // Don't recommend upgrades from stable to prerelease
  if (isStable(currentVersion) && isPrerelease(newVersion)) {
    return false;
  }

  // All other upgrades are recommended
  return true;
}

/**
 * Classify an upgrade type
 */
export function getUpgradeType(
  currentVersion: string,
  newVersion: string,
): "major" | "minor" | "patch" | "prerelease" | "downgrade" | "same" {
  try {
    const current = parseSemver(currentVersion);
    const next = parseSemver(newVersion);

    const comparison = compareSemver(currentVersion, newVersion);

    if (comparison === 0) {
      return "same";
    }

    if (comparison > 0) {
      return "downgrade";
    }

    // It's an upgrade
    if (current.major !== next.major) {
      return "major";
    }

    if (current.minor !== next.minor) {
      return "minor";
    }

    if (current.patch !== next.patch) {
      return "patch";
    }

    // Same major.minor.patch, must be prerelease difference
    return "prerelease";
  } catch {
    // If parsing fails, fallback to simple comparison
    const comparison = compareSemver(currentVersion, newVersion);
    if (comparison === 0) return "same";
    if (comparison > 0) return "downgrade";
    return "minor"; // Default assumption
  }
}
