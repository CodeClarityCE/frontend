import {
  RemediationKind,
  type TopLevelDependency,
} from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

import type { TicketInstance, TicketRemediation } from "../tickets.entity";

/** One vulnerability a remediation resolves, with each installed version it is found in. */
export interface ResolvedVulnerability {
  vulnerability_id: string;
  severity_class: string;
  /** The highest score among its instances; null when none has one */
  severity_score: number | null;
  /** True once the current analysis no longer has any of its instances */
  resolved: boolean;
  instances: TicketInstance[];
}

const VERB: Record<RemediationKind, string> = {
  [RemediationKind.UpgradeDirect]: "Upgrade",
  [RemediationKind.UpgradeTopLevel]: "Upgrade",
  [RemediationKind.ForceVersion]: "Force",
};

/** The change in words, as the ticket title and external issue name it: "Force js-yaml to 4.3.2". */
export function remediationTitle(remediation: TicketRemediation): string {
  const where =
    remediation.workspace === "." ? "" : ` in ${remediation.workspace}`;
  return `${VERB[remediation.kind]} ${remediation.package} to ${remediation.target_version}${where}`;
}

/** A top-level path written as "express@4.17.0 > qs@6.5.0". */
export function pathText(dependency: TopLevelDependency): string {
  return dependency.path.map((p) => `${p.name}@${p.version}`).join(" > ");
}

/** Instances grouped by vulnerability, worst first, then in their original order. */
export function groupByVulnerability(
  instances: TicketInstance[],
): ResolvedVulnerability[] {
  const groups = new Map<string, ResolvedVulnerability>();
  for (const instance of instances) {
    let group = groups.get(instance.vulnerability_id);
    if (!group) {
      group = {
        vulnerability_id: instance.vulnerability_id,
        severity_class: instance.severity_class,
        severity_score: null,
        resolved: true,
        instances: [],
      };
      groups.set(instance.vulnerability_id, group);
    }
    group.instances.push(instance);
    if (instance.is_active) group.resolved = false;
    if (
      instance.severity_score !== null &&
      (group.severity_score === null ||
        instance.severity_score > group.severity_score)
    ) {
      group.severity_score = instance.severity_score;
      group.severity_class = instance.severity_class;
    }
  }
  return [...groups.values()].sort(
    (a, b) => (b.severity_score ?? -1) - (a.severity_score ?? -1),
  );
}

/** True when an instance has a fix commit, compare view or registry diff. */
export function hasDiffLinks(instance: TicketInstance): boolean {
  const links = instance.diff_links;
  return (
    links.fix_commits.length > 0 ||
    links.compare !== null ||
    links.registry_diff !== null
  );
}
