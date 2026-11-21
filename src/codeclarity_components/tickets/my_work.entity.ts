import type { FixNextRank } from "@/codeclarity_components/vulnerabilities/fix_next.entity";
import type { RemediationKind } from "@/codeclarity_components/vulnerabilities/organization_vulnerability.entity";

import type { TicketPriority, TicketStatus } from "./tickets.entity";

/** Where a ticket stands against its due date, as the API computes it. */
export type DeadlineState = "overdue" | "due_soon" | "on_track" | "none";

/** One open ticket assigned to the signed-in user, most pressing first. */
export interface MyWorkEntry {
  ticket_id: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  project_id: string;
  project_name: string;
  due_date: string | null;
  deadline: DeadlineState;
  /** The remediation the ticket tracks; null for an old one-vulnerability ticket */
  remediation: {
    kind: RemediationKind;
    workspace: string;
    package: string;
    target_version: string | null;
  } | null;
  /** The vulnerability of an old one-vulnerability ticket */
  vulnerability_id: string | null;
  affected_package: string | null;
  /** The Fix next rank of what the ticket still tracks */
  rank: FixNextRank;
}
