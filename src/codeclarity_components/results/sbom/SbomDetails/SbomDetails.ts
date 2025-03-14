export interface ImportPathsRep {
    data: string;
    dependencies: ImportPathsRep[];
}

export enum LinkType {
    GITHUB = 'GITHUB',
    GITLAB = 'GITLAB',
    UNKOWN_GIT_SERVER = 'UNKOWN_GIT_SERVER',
    REMOTE_TARBALL = 'REMOTE_TARBALL',
    LOCAL_FILE = 'LOCAL_FILE',
    PACKAGE_MANAGED = 'PACKAGE_MANAGED',
    UNKNOWN_LINK_TYPE = 'UNKNOWN_LINK_TYPE',
    SELF_MANAGED = 'SELF_MANAGED'
}

export interface Source {
    Type: string;
    Url: string;
}

export interface SeverityDist {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
}

export class DependencyDetails {
    name!: string;
    version!: string;
    newest_release!: string;
    dependencies!: { [key: string]: string; };
    dev_dependencies!: { [key: string]: string; };
    transitive!: boolean;
    source?: Source;
    package_manager!: string;
    license!: string;
    engines?: { [key: string]: string };
    release!: Date;
    // key!: string;
    // parents!: string[];
    // dependencies!: string[];
    // optional_dependencies!: string[];
    // peer_dependencies!: string[];
    // bundled_dependencies!: string[];
    // optional!: boolean;
    // bundled!: boolean;
    // peer!: boolean;
    // scoped!: boolean;
    // // dev: boolean;
    // link_type!: LinkType;
    // version_type!: Enumerator;
    // purl!: string;
    // purl_no_version!: string;
    // linked_git_url?: ParsedGitUrl;
    // git_url?: ParsedGitUrl;
    // file_path!: string;
    // is_package_managed!: boolean;
    // is_self_managed!: boolean;
    // is_direct!: boolean;
    // is_transitive!: boolean;
    // is_direct_count!: number;
    // is_transitive_count!: number;
    // is_prod_count!: number;
    // is_dev_count!: number;
    // licenses!: string[];
    // non_spdx_licenses!: string[];
    // package_manager!: string;
    // vulnerable!: boolean;
    // vulnerabilities!: string[];
    // severity_dist!: SeverityDist;
    // mean_severity!: number;
    // combined_severity!: number;
    // patchable_paths!: string[];
    // patch_type!: string;
    // deprecated!: boolean;
    // outdated!: boolean;
    // unlicensed!: boolean;
    // deprecated_message!: string;
    // outdated_message!: string;
    // version_age!: number;
    // newest_release!: string;
    // last_published!: Date;
    // engines!: Map<string, string>;
}
