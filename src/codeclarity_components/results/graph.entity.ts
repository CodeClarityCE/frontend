export interface License {
    id?: string;
    name?: string;
    [key: string]: unknown;
}

export interface SeverityDistribution {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
    none?: number;
    [key: string]: unknown;
}

export interface GitUrl {
    url?: string;
    type?: string;
    [key: string]: unknown;
}

export type DependencyMap = Record<string, string | string[] | undefined>;

export class GraphDependency {
    id!: string;
    parentIds?: string[];
    childrenIds?: string[];
    prod!: boolean;
    dev!: boolean;
}

export class Dependency {
    bundled!: boolean;
    bundled_dependencies!: string[];
    dependencies!: string[];
    deprecated!: boolean;
    deprecated_message!: string;
    dev!: boolean;
    prod!: boolean;
    file_path!: string;
    git_url!: Map<string, string>;
    is_direct!: boolean;
    is_package_managed!: boolean;
    is_self_managed!: boolean;
    is_transitive!: boolean;
    is_transitive_count!: number;
    is_direct_count!: number;
    is_dev_count!: number;
    is_prod_count!: number;
    key!: string;
    last_published!: string;
    licenses!: License[];
    link_type!: string;
    linked_git_url!: GitUrl | null;
    name!: string;
    newest_release!: string;
    non_spdx_licenses!: Record<string, unknown> | null;
    severity_dist!: SeverityDistribution | null;
    optional!: boolean;
    optional_dependencies!: DependencyMap | null;
    outdated!: boolean;
    outdated_message!: string;
    parents!: string[];
    peer!: boolean;
    peer_dependencies!: DependencyMap | null;
    purl!: string;
    purl_no_version!: string;
    release!: string;
    scoped!: boolean;
    unlicensed!: boolean;
    version!: string;
    version_age!: number;
    version_type!: string;
    engines!: Map<string, string>;
}
