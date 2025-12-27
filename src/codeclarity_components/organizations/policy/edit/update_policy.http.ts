import type { LicensePolicyType } from "../license_policy.entity";

export interface PolicyUpdate {
  name: string;
  description: string;
  type: LicensePolicyType;
  licenses: string[];
  default: boolean;
}
