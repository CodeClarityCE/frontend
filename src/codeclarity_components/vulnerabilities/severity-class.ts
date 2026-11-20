import { SEVERITY_LEVELS, type SeverityLevel } from "@/utils/severity";

// The severity level of an API severity class, such as "CRITICAL"; "none" when unknown.
export function levelOfClass(
  severityClass: string | null | undefined,
): SeverityLevel {
  const level = (severityClass ?? "").toLowerCase() as SeverityLevel;
  return SEVERITY_LEVELS.includes(level) ? level : "none";
}
