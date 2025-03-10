import { IsNotEmpty, IsString } from 'class-validator';
export class SbomGraph {
    @IsNotEmpty()
    graph!: Graph;

    @IsNotEmpty()
    @IsString()
    project_name!: string;
}

class Graph {
    dependencies!: Map<string, Dependency>;
    start_deps!: Array<string>;
    start_deps_constraints!: Map<string, string>;
    start_dev_deps!: Array<string>;
    start_dev_deps_constraints!: Map<string, string>;
}

export class Dependency {
    bundled!: boolean;
    bundled_dependencies!: Array<string>;
    dependencies!: Array<string>;
    deprecated!: boolean;
    deprecated_message!: string;
    dev!: boolean;
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
    licenses!: Array<any>;
    link_type!: string;
    linked_git_url!: any;
    name!: string;
    newest_release!: string;
    non_spdx_licenses!: any;
    severity_dist!: any;
    optional!: boolean;
    optional_dependencies!: any;
    outdated!: boolean;
    outdated_message!: string;
    parents!: Array<string>;
    peer!: boolean;
    peer_dependencies!: any;
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
