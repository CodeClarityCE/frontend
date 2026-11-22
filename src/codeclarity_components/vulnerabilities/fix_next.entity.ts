import type { TicketStatus } from "@/codeclarity_components/tickets/tickets.entity";

import type {
  RemediationKind,
  SeverityClass,
} from "./organization_vulnerability.entity";

/** The reasons for a Fix next entry's place; there is no numeric score. */
export interface FixNextRank {
  /** The worst severity among the resolved instances */
  severity_class: SeverityClass;
  known_exploited: boolean;
  /** A resolved EPSS score is at or above the API's high EPSS threshold */
  high_epss: boolean;
  /** False when only development dependencies install it */
  prod: boolean;
  instance_count: number;
}

/** The change one entry makes in one project workspace. */
interface FixNextRemediation {
  project_id: string;
  project_name: string;
  workspace: string;
  command: string | null;
  ticket: { id: string; status: TicketStatus } | null;
}

/** One change across the organization's projects, most urgent first. */
export interface FixNextEntry {
  kind: RemediationKind;
  package: string;
  target_version: string;
  potentially_breaking: boolean;
  /** The worst vulnerability it resolves */
  vulnerability_id: string;
  rank: FixNextRank;
  vulnerability_count: number;
  project_count: number;
  instance_count: number;
  remediations: FixNextRemediation[];
}
