import type { StatusTone } from "@/base_components/page";

/** The fields every policy kind shares. */
export interface Policy {
  id: string;
  name: string;
  description: string;
  policy_type: string;
  default: boolean;
  created_by?: string;
  created_on: Date;
  content: string[];
}

/** Policy types in words: a whitelist allows, a blacklist blocks. */
export function policyTypeLabel(type: string): string {
  if (type === "WHITELIST") return "Allow list";
  if (type === "BLACKLIST") return "Block list";
  return type;
}

export function policyTypeTone(type: string): StatusTone {
  if (type === "WHITELIST") return "success";
  if (type === "BLACKLIST") return "warning";
  return "neutral";
}
