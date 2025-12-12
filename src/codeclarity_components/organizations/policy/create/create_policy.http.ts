import type { LicensePolicyType } from '../license_policy.entity';

export interface CreatePolicy {
    name: string;
    description: string;
    type: LicensePolicyType;
    licenses: any[];
    default: boolean;
}
