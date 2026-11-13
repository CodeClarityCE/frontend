import type { StatusTone } from "@/base_components/page";
import { getDaysUntilExpiry } from "@/utils/dateUtils";

// A token this close to its expiry is flagged so it gets replaced in time.
export const EXPIRES_IN_DAYS_RISK = 14;

export interface IntegrationHealth {
  tone: StatusTone;
  label: string;
  /** Longer explanation for the detail page. */
  hint: string;
}

/** The health of a token based integration, in words and a status tone. */
export function integrationHealth(integration: {
  invalid: boolean;
  expiry_date?: Date | string | null;
}): IntegrationHealth {
  if (integration.invalid) {
    return {
      tone: "danger",
      label: "Invalid",
      hint: "The token expired or its permissions changed.",
    };
  }
  if (integration.expiry_date) {
    const days = getDaysUntilExpiry(integration.expiry_date);
    if (days <= 0) {
      return {
        tone: "danger",
        label: "Expired",
        hint: "The token has expired. Replace it to keep analyses running.",
      };
    }
    if (days <= EXPIRES_IN_DAYS_RISK) {
      return {
        tone: "warning",
        label: "Expiring soon",
        hint: "Replace the token before it expires.",
      };
    }
  }
  return { tone: "success", label: "Healthy", hint: "The token works." };
}
