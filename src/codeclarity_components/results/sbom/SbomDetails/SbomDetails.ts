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
    latest_version!: string;
    dependencies!: { [key: string]: string };
    dev_dependencies!: { [key: string]: string };
    transitive!: boolean;
    source?: Source;
    package_manager!: string;
    license!: string;
    engines?: { [key: string]: string };
    release_date!: Date;
    lastest_release_date!: Date;
    vulnerabilities!: string[];
    severity_dist!: SeverityDist;
    // file_path!: string;
    // mean_severity!: number;
    // combined_severity!: number;
    // patchable_paths!: string[];
    // patch_type!: string;
    // deprecated!: boolean;
}
