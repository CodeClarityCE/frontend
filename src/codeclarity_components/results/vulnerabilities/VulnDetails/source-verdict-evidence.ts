// Plain-English evidence for one source verdict, shown next to it in the detail panel.

import {
  type SourceAffected,
  type SourceProduct,
  type SourceRange,
  type SourceVerdict,
  SourceVerdictValue,
} from "./VulnDetails.types";

const STATUS_NOTES: Record<string, string> = {
  stale: "Its data was out of date when this analysis ran.",
  failed: "Its last update had failed when this analysis ran.",
  unknown: "Its state could not be read when this analysis ran.",
};

const RETIRED_REASONS: Record<string, string> = {
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  removed: "Removed",
};

// A range as ">=1.0.0 <2.0.0"; an open bound is left out.
function formatRange(range: SourceRange): string {
  const parts = [
    range.introduced ? `>=${range.introduced}` : "",
    range.fixed ? `<${range.fixed}` : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "all versions";
}

function formatAffected(affected: SourceAffected): string {
  if (affected.universal) return "all versions";
  const parts = [...affected.ranges.map(formatRange), ...affected.exact];
  return parts.length > 0 ? parts.join(", ") : "no versions it could read";
}

// "PyPI left-pad", "acme left-pad (wordpress)".
function formatProduct(name: SourceProduct): string {
  const label = [name.ecosystem, name.package, name.vendor, name.product]
    .filter(Boolean)
    .join(" ");
  return name.target_sw ? `${label} (${name.target_sw})` : label;
}

export function verdictEvidence(verdict: SourceVerdict): string {
  const evidence = verdict.evidence;
  switch (verdict.verdict) {
    case SourceVerdictValue.StaleOrFailed:
      return (
        STATUS_NOTES[evidence?.source_status ?? "unknown"] ??
        STATUS_NOTES.unknown!
      );
    case SourceVerdictValue.VersionExcluded: {
      const notes: string[] = [];
      if (evidence?.evaluated) {
        notes.push(`Affects ${formatAffected(evidence.evaluated)}.`);
      }
      if (evidence?.unaffected) {
        notes.push(`Marks ${formatAffected(evidence.unaffected)} unaffected.`);
      }
      return notes.join(" ");
    }
    case SourceVerdictValue.Retired: {
      const reason =
        RETIRED_REASONS[evidence?.retired_reason ?? ""] ?? "Retired";
      const date = evidence?.retired_at?.slice(0, 10);
      return date ? `${reason} on ${date}.` : `${reason}.`;
    }
    case SourceVerdictValue.NamesAnotherProduct: {
      const names = (evidence?.names ?? []).map(formatProduct);
      return names.length > 0 ? `Names ${names.join(", ")}.` : "";
    }
    case SourceVerdictValue.NoPackageData:
      return "The record names no package.";
    default:
      return "";
  }
}
