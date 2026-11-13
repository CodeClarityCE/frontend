// Labels and lookups shared by the vulnerability list, table and details.
import type { StatusTone } from "@/base_components/page";
import { severityLevel } from "@/utils/severity";

import type { Severity, VulnerabilityMerged, WeaknessInfo } from "./VulnStats";

export interface OwaspCategory {
  id: string;
  name: string;
  description: string;
  impact: string;
}

// OWASP Top 10 2021, keyed by the CWE view id the API returns.
const OWASP_TOP_10: Record<string, OwaspCategory> = {
  "1345": {
    id: "A01",
    name: "Broken Access Control",
    description:
      "Failures related to restrictions on what authenticated users are allowed to do.",
    impact: "Unauthorized access to data, functions, or entire systems.",
  },
  "1346": {
    id: "A02",
    name: "Cryptographic Failures",
    description:
      "Failures related to cryptography which lead to exposure of sensitive data.",
    impact:
      "Data breaches, identity theft, and exposure of sensitive information.",
  },
  "1347": {
    id: "A03",
    name: "Injection",
    description:
      "Untrusted data is sent to an interpreter as part of a command or query.",
    impact:
      "Data loss, corruption, denial of access, or complete host takeover.",
  },
  "1348": {
    id: "A04",
    name: "Insecure Design",
    description:
      "Missing or ineffective control design that could have prevented attacks.",
    impact: "Wide range of attacks depending on the missing security controls.",
  },
  "1349": {
    id: "A05",
    name: "Security Misconfiguration",
    description:
      "Missing security hardening or improperly configured permissions.",
    impact: "Unauthorized access to system data or functionality.",
  },
  "1352": {
    id: "A06",
    name: "Vulnerable Components",
    description:
      "Using components with known vulnerabilities or outdated versions.",
    impact: "Range from minimal to complete host takeover and data compromise.",
  },
  "1353": {
    id: "A07",
    name: "Authentication Failures",
    description:
      "Application functions related to authentication and session management.",
    impact: "Compromise of passwords, keys, or session tokens.",
  },
  "1354": {
    id: "A08",
    name: "Software and Data Integrity",
    description:
      "Code and infrastructure that does not protect against integrity violations.",
    impact: "Unauthorized code execution and system compromise.",
  },
  "1355": {
    id: "A09",
    name: "Logging and Monitoring",
    description:
      "Insufficient logging and monitoring coupled with missing incident response.",
    impact: "Allows attacks to continue undetected and escalate.",
  },
  "1356": {
    id: "A10",
    name: "Server-Side Request Forgery",
    description:
      "The application fetches a remote resource without validating the user-supplied URL.",
    impact: "Unauthorized access to internal systems and data exfiltration.",
  },
};

const UNCATEGORIZED: OwaspCategory = {
  id: "Other",
  name: "Uncategorized",
  description:
    "This vulnerability does not map to a specific OWASP Top 10 category.",
  impact: "Impact varies depending on the specific vulnerability.",
};

export function owaspCategory(id: string): OwaspCategory {
  return OWASP_TOP_10[id] ?? UNCATEGORIZED;
}

// The distinct OWASP categories of a finding's weaknesses.
export function owaspCategories(
  weaknesses: WeaknessInfo[] | null | undefined,
): OwaspCategory[] {
  const ids = new Set(
    (weaknesses ?? []).map((w) => w.OWASPTop10Id).filter((id) => id !== ""),
  );
  return [...ids].map(owaspCategory);
}

// EPSS above this share means a high chance of exploitation.
export const HIGH_EPSS = 0.1;

export function formatPercent(share: number): string {
  return `${(share * 100).toFixed(1)}%`;
}

export interface Signal {
  label: string;
  tone: StatusTone;
  detail: string;
}

// The warnings a finding carries: policy exclusion, EPSS and match conflicts.
export function findingSignals(finding: VulnerabilityMerged): Signal[] {
  const signals: Signal[] = [];
  if (finding.is_blacklisted) {
    const policies = finding.blacklisted_by_policies ?? [];
    signals.push({
      label: "Policy excluded",
      tone: "neutral",
      detail: policies.length
        ? `Excluded by ${policies.join(", ")}.`
        : "Excluded by a vulnerability policy.",
    });
  }
  if (finding.EPSS?.Score > HIGH_EPSS) {
    signals.push({
      label: `Exploit risk ${formatPercent(finding.EPSS.Score)}`,
      tone: "danger",
      detail:
        "EPSS predicts a high chance of exploitation in the next 30 days. Prioritise patching.",
    });
  }
  const flag = finding.Conflict?.ConflictFlag;
  if (flag === "MATCH_POSSIBLE_INCORRECT") {
    signals.push({
      label: "Match uncertain",
      tone: "warning",
      detail:
        "Vulnerability sources disagree on the affected versions. Verify before acting.",
    });
  } else if (flag === "MATCH_INCORRECT") {
    signals.push({
      label: "Match conflict",
      tone: "warning",
      detail: "This match is likely incorrect and may not affect this version.",
    });
  }
  return signals;
}

export interface ImpactEntry {
  name: string;
  value: string;
  high: boolean;
}

function readable(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

// The confidentiality, integrity and availability impacts a finding has.
export function impacts(severity: Severity | null | undefined): ImpactEntry[] {
  if (!severity) return [];
  const entries: [string, string][] = [
    ["Confidentiality", severity.ConfidentialityImpact],
    ["Integrity", severity.IntegrityImpact],
    ["Availability", severity.AvailabilityImpact],
  ];
  return entries
    .filter(([, value]) => value && value !== "NONE")
    .map(([name, value]) => ({
      name,
      value: readable(value),
      high: value === "HIGH" || value === "COMPLETE",
    }));
}

export interface PatchStatus {
  label: string;
  tone: StatusTone;
}

export function patchStatus(patchType: string): PatchStatus {
  if (patchType === "FULL") return { label: "Patchable", tone: "success" };
  if (patchType === "PARTIAL")
    return { label: "Partially patchable", tone: "warning" };
  return { label: "Not patchable", tone: "danger" };
}

// What a new ticket needs to know about a finding.
export function ticketVulnerability(finding: VulnerabilityMerged): {
  vulnerability_id: string;
  severity_score: number;
  severity_class: string;
  affected_package?: string;
  affected_version?: string;
  description: string;
} {
  const level = severityLevel(finding.Severity?.Severity);
  return {
    vulnerability_id: finding.Vulnerability,
    severity_score: finding.Severity?.Severity,
    severity_class: level === "none" ? "LOW" : level.toUpperCase(),
    affected_package: finding.Affected?.[0]?.AffectedDependency,
    affected_version: finding.Affected?.[0]?.AffectedVersion,
    description: finding.Description,
  };
}

// The route of a finding's details page.
export function detailsRoute(
  analysisID: string,
  projectID: string,
  findingID: string,
): {
  name: string;
  params: { page: string };
  query: Record<string, string>;
} {
  return {
    name: "results",
    params: { page: "vulnerabilities_details" },
    query: {
      analysis_id: analysisID,
      project_id: projectID,
      finding_id: findingID,
    },
  };
}

// The first sentences of a description, without markdown heading marks.
export function shortDescription(description: string, maxLength = 160): string {
  const clean = description.replace(/^#+\s*/gm, "").trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  const space = cut.lastIndexOf(" ");
  return `${space > maxLength * 0.7 ? cut.slice(0, space) : cut}...`;
}
