export function isNoneSeverity(n: number): boolean {
  return n === 0.0 || n === undefined;
}
export function isLowSeverity(n: number): boolean {
  return n < 4.0 && n > 0.0;
}
export function isMediumSeverity(n: number): boolean {
  return n >= 4.0 && n < 7.0;
}
export function isHighSeverity(n: number): boolean {
  return n >= 7.0 && n < 9.0;
}
export function isCriticalSeverity(n: number): boolean {
  return n >= 9.0;
}

export type SeverityLevel = "critical" | "high" | "medium" | "low" | "none";

export const SEVERITY_LEVELS: SeverityLevel[] = [
  "critical",
  "high",
  "medium",
  "low",
  "none",
];

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "None",
};

// The CVSS band a score falls in; a missing score counts as none.
export function severityLevel(score: number | null | undefined): SeverityLevel {
  if (score === null || score === undefined || score <= 0) return "none";
  if (score >= 9.0) return "critical";
  if (score >= 7.0) return "high";
  if (score >= 4.0) return "medium";
  return "low";
}

// The level for a severity name from the API, such as "CRITICAL"; unknown names count as none.
export function severityLevelFromLabel(
  label: string | null | undefined,
): SeverityLevel {
  const level = label?.toLowerCase() as SeverityLevel | undefined;
  return level && SEVERITY_LEVELS.includes(level) ? level : "none";
}
