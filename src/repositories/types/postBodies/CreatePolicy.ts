export enum LicensePolicyType {
    WHITELIST = 'WHITELIST',
    BLACKLIST = 'BLACKLIST'
}

export interface CreatePolicy {
    name: string;
    description: string;
    type: LicensePolicyType;
    licenses: Array<any>;
    default: boolean;
}

export interface PolicyUpdate {
    name: string;
    description: string;
    type: LicensePolicyType;
    licenses: Array<any>;
    default: boolean;
}
