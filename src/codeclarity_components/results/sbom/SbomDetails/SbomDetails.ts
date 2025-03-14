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
    lastes_release!: Date;
    // file_path!: string;
    // vulnerabilities!: string[];
    // severity_dist!: SeverityDist;
    // mean_severity!: number;
    // combined_severity!: number;
    // patchable_paths!: string[];
    // patch_type!: string;
    // deprecated!: boolean;
}
