/**
 * OWASP Top 10 2021 utility functions and mappings
 */

export interface OwaspCategory {
  id: string;
  name: string;
  description: string;
  impact: string;
}

/**
 * OWASP Top 10 2021 mapping
 * Key is the CWE category ID that maps to the OWASP category
 */
export const owaspTop10_2021: Record<string, OwaspCategory> = {
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
      "Application is vulnerable to injection attacks when untrusted data is sent as part of a command or query.",
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
      "Missing appropriate security hardening or improperly configured permissions.",
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
    name: "Software & Data Integrity",
    description:
      "Code and infrastructure that does not protect against integrity violations.",
    impact: "Unauthorized code execution and system compromise.",
  },
  "1355": {
    id: "A09",
    name: "Logging & Monitoring",
    description:
      "Insufficient logging and monitoring coupled with missing incident response.",
    impact: "Allows attacks to continue undetected and escalate.",
  },
  "1356": {
    id: "A10",
    name: "Server-Side Request Forgery",
    description:
      "SSRF flaws occur when a web application fetches a remote resource without validating user-supplied URL.",
    impact: "Unauthorized access to internal systems and data exfiltration.",
  },
};

/**
 * Default OWASP info for unknown categories
 */
const defaultOwaspInfo: OwaspCategory = {
  id: "Unknown",
  name: "Uncategorized",
  description:
    "This vulnerability does not map to a specific OWASP Top 10 category.",
  impact: "Impact varies depending on the specific vulnerability.",
};

/**
 * Get OWASP category information by CWE category ID
 */
export function getOwaspInfo(cweId: string): OwaspCategory {
  return owaspTop10_2021[cweId] ?? defaultOwaspInfo;
}

/**
 * Get OWASP category by OWASP ID (A01, A02, etc.)
 */
export function getOwaspInfoById(owaspId: string): OwaspCategory {
  const entry = Object.values(owaspTop10_2021).find(
    (cat) => cat.id === owaspId,
  );
  return entry ?? defaultOwaspInfo;
}

/**
 * Get unique OWASP IDs from a list of weaknesses
 */
export function getUniqueOwaspIds(
  weaknesses: { OWASPTop10Id?: string }[],
): string[] {
  const owaspIds = weaknesses
    .map((w) => w.OWASPTop10Id)
    .filter((id): id is string => !!id && id !== "");
  return Array.from(new Set(owaspIds));
}
