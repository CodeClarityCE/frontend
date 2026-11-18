import { formatShortDate } from "@/utils/dateUtils";

import {
  ExternalProviderLabels,
  type ExternalTicketProvider,
  type TicketEvent,
  TicketEventType,
  type TicketPriority,
  TicketPriorityLabels,
  type TicketStatus,
  TicketStatusLabels,
} from "../tickets.entity";

function text(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function statusLabel(value: string | undefined): string | undefined {
  return value
    ? (TicketStatusLabels[value as TicketStatus] ?? value)
    : undefined;
}

function priorityLabel(value: string | undefined): string | undefined {
  return value
    ? (TicketPriorityLabels[value as TicketPriority] ?? value)
    : undefined;
}

function providerLabel(data: Record<string, unknown>): string {
  const provider = text(data, "external_provider");
  if (!provider) return "the external tracker";
  return ExternalProviderLabels[provider as ExternalTicketProvider] ?? provider;
}

// "from A to B", or "to B" when the old value is unknown.
function change(from: string | undefined, to: string | undefined): string {
  if (from && to) return ` from ${from} to ${to}`;
  if (to) return ` to ${to}`;
  return "";
}

/** One readable line for a ticket history event. */
export function eventLabel(event: TicketEvent): string {
  const data = event.event_data ?? {};
  switch (event.event_type) {
    case TicketEventType.CREATED:
      return "Created the ticket";
    case TicketEventType.STATUS_CHANGED:
      return `Changed the status${change(
        statusLabel(text(data, "old_status")),
        statusLabel(text(data, "new_status")),
      )}`;
    case TicketEventType.PRIORITY_CHANGED:
      return `Changed the priority${change(
        priorityLabel(text(data, "old_priority")),
        priorityLabel(text(data, "new_priority")),
      )}`;
    case TicketEventType.ASSIGNED: {
      const name = text(data, "assigned_to_name");
      return name ? `Assigned the ticket to ${name}` : "Assigned the ticket";
    }
    case TicketEventType.UNASSIGNED:
      return "Unassigned the ticket";
    case TicketEventType.SYNCED_EXTERNAL:
      return `Synced the ticket to ${providerLabel(data)}`;
    case TicketEventType.SYNCED_FROM_EXTERNAL:
      return `Took the status from ${providerLabel(data)}${change(
        statusLabel(text(data, "old_status")),
        statusLabel(text(data, "new_status")),
      )}`;
    case TicketEventType.UNLINKED_EXTERNAL:
      return `Unlinked the ticket from ${providerLabel(data)}`;
    case TicketEventType.OCCURRENCE_ADDED:
      return "Found a new occurrence";
    case TicketEventType.OCCURRENCE_RESOLVED:
      return "An occurrence was fixed";
    case TicketEventType.RESOLVED:
      return "Resolved the ticket";
    case TicketEventType.REOPENED:
      return "Reopened the ticket";
    case TicketEventType.COMMENT_ADDED:
      return "Added a comment";
    case TicketEventType.DUE_DATE_CHANGED: {
      const due = text(data, "new_due_date");
      return due
        ? `Set the due date to ${formatShortDate(due)}`
        : "Removed the due date";
    }
    default:
      return String(event.event_type);
  }
}

/** Who made the change: a person, or the automation or sync. */
export function eventActor(event: TicketEvent): string {
  if (event.performed_by_name) return event.performed_by_name;
  const source = event.event_data?.source;
  if (source === "automation") return "Automation";
  if (source === "sync") return "Sync";
  return "CodeClarity";
}
