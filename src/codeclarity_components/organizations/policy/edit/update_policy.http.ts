import type { LicensePolicyType } from "../license_policy.entity";

export interface PolicyUpdate {
    name: string;
    description: string;
    type: LicensePolicyType;
    licenses: Array<any>;
    default: boolean;
}
