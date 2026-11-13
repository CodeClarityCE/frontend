import type { StatusTone } from "@/base_components/page";

import type { License } from "./License";

export interface LicenseStatus {
  label: string;
  tone: StatusTone;
}

// The shared status of a license: violation, needs review or compliant.
export function licenseStatus(license: License): LicenseStatus {
  if (license.license_compliance_violation)
    return { label: "Violation", tone: "danger" };
  if (license.unable_to_infer)
    return { label: "Needs review", tone: "warning" };
  return { label: "Compliant", tone: "success" };
}

export type LicenseFamily = "Permissive" | "Copyleft" | "Other";

const COPYLEFT = ["GPL", "LGPL", "AGPL", "MPL", "EPL", "CDDL", "EUPL"];
const PERMISSIVE = ["MIT", "BSD", "APACHE", "ISC", "ZLIB"];

// Permissive or copyleft, from the category or else the license id.
export function licenseFamily(license: License): LicenseFamily {
  const category = license.license_category?.toLowerCase() ?? "";
  if (category.includes("permissive")) return "Permissive";
  if (category.includes("copyleft")) return "Copyleft";
  const id = `${license.id ?? ""} ${license.name ?? ""}`.toUpperCase();
  if (COPYLEFT.some((name) => id.includes(name))) return "Copyleft";
  if (PERMISSIVE.some((name) => id.includes(name))) return "Permissive";
  return "Other";
}

export function licenseName(license: License): string {
  return license.name || license.id;
}

const DESCRIPTIONS: Record<string, string> = {
  "commercial-use": "The software may be used for commercial purposes.",
  modifications: "The software may be modified.",
  distribution: "The software may be distributed.",
  "private-use": "The software may be used and modified in private.",
  "include-copyright":
    "A copy of the license and copyright notice must be included with the software.",
  "include-copyright-source":
    "A copy of the license and copyright notice must be included with the software in source form, but is not required for binaries.",
  "document-changes": "Changes made to the code must be documented.",
  "disclose-source":
    "Source code must be made available when the software is distributed.",
  "network-use-disclose":
    "Users who interact with the software via network are given the right to receive a copy of the source code.",
  "same-license":
    "Modifications must be released under the same license when distributing the software. In some cases a similar or related license may be used.",
  "same-license-file":
    "Modifications of existing files must be released under the same license when distributing the software. In some cases a similar or related license may be used.",
  "same-license-library":
    "Modifications must be released under the same license when distributing the software. In some cases a similar or related license may be used, or this condition may not apply to works that use the software as a library.",
  "trademark-use":
    "This license explicitly states that it does NOT grant trademark rights, even though licenses without such a statement probably do not grant any implicit trademark rights.",
  liability: "This license includes a limitation of liability.",
  warranty:
    "The license explicitly states that it does NOT provide any warranty.",
};

// What a license property means, from choosealicense.com.
export function propertyDescription(
  property: string,
  kind: "permission" | "condition" | "limitation",
): string {
  if (property === "patent-use") {
    return kind === "permission"
      ? "This license provides an express grant of patent rights from contributors."
      : "This license explicitly states that it does NOT grant any rights in the patents of contributors.";
  }
  return DESCRIPTIONS[property] ?? "No information available.";
}

export function propertyName(property: string): string {
  return property
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
