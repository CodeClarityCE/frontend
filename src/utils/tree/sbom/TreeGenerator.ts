export interface FilterConfig {
    searchKey: string;
    licenseId: string;
    directDepKey: string;
    transitiveDepKey: string;
    vulnereabilitySeverity: string[];
    vulnereabilityStatus: string;
    dependencyHealth: string[];
    dependencyIntegration: string[];
    patchableStatus: string[];
}

export interface Counter {
    count: number;
}

export interface PaginationConfig {
    apply: boolean;
    entriesPerPage: number;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number; // Ceil(#nodes / entriesPerPage)
    matchingPagesCount: number; // Ceil(#nodes satisfying the filter / entriesPerPage)
    matchingItemCount: number; // #nodes satisfying the filter
    returnedItemCount: number; // Min(#nodes satisfying the filter, entriesPerPage)
}

export interface SeverityDist {
    critical: number;
    high: number;
    medium: number;
    low: number;
    none: number;
}

export const enum LinkType {
    GITHUB = 'GITHUB',
    GITLAB = 'GITLAB',
    UNKOWN_GIT_SERVER = 'UNKOWN_GIT_SERVER',
    REMOTE_TARBALL = 'REMOTE_TARBALL',
    LOCAL_FILE = 'LOCAL_FILE',
    PACKAGE_MANAGED = 'PACKAGE_MANAGED',
    UNKNOWN_LINK_TYPE = 'UNKNOWN_LINK_TYPE',
    SELF_MANAGED = 'SELF_MANAGED'
}

export const enum VersionType {
    RESOLVED_SEMVER = 'RESOLVED_SEMVER',
    UNRESOLVED_SEMVER = 'UNRESOLVED_SEMVER',
    COMMIT_ID_OR_BRANCH_OR_VERSION_TAG = 'COMMIT_ID_OR_BRANCH_OR_VERSION_TAG',
    HASH = 'HASH',
    UNKOWN_VERSION_TYPE = 'UNKOWN_VERSION_TYPE'
}

export const enum PatchType {
    FULL = 'FULL',
    PARTIAL = 'PARTIAL',
    NONE = 'NONE'
}

export interface Dependency {
    name: string;
    version: string;
    key: string;
    parents: string[];
    dependencies: string[];
    optional_dependencies: string[];
    peer_dependencies: string[];
    bundled_dependencies: string[];
    optional: boolean;
    bundled: boolean;
    peer: boolean;
    scoped: boolean;
    dev: boolean;
    link_type: LinkType;
    version_type: VersionType;
    purl: string;
    purl_no_version: string;
    linked_git_url?: ParsedGitUrl;
    git_url?: ParsedGitUrl;
    file_path: string;
    is_package_managed: boolean;
    is_self_managed: boolean;
    is_direct_count: number;
    is_transitive_count: number;
    is_prod_count: number;
    is_dev_count: number;
    licenses: string[];
    non_spdx_licenses: string[];
    package_manager: string;
    vulnerable: boolean;
    vulnerabilities: string[];
    severity_dist: SeverityDist;
    mean_severity: number;
    combined_severity: number;
    patchable_paths: string[];
    patch_type: PatchType;
    deprecated: boolean;
    outdated: boolean;
    unlicensed: boolean;
    deprecated_message: string;
    outdated_message: string;
    release: Date;
    version_age: number;
    newest_release: string;
    last_published: Date;
}

export interface Graph {
    dependencies: { [key: string]: Dependency };
    start_dev_deps: string[];
    start_deps: string[];
}

export interface AnalysisInfo {
    status: string;
    private_errors: PrivateError[];
    public_errors: PublicError[];
    project_name: string;
    working_directory: string;
    package_manager: string;
    lock_file_version: number;
    lock_file_path: string;
    package_file_path: string;
    relative_lock_file_path: string;
    relative_package_file_path: string;
    analysis_start_time: string;
    analysis_end_time: string;
    analysis_delta_time: number;
    version_seperator: string;
    import_path_seperator: string;
    default_workspace_name: string;
    self_managed_workspace_name: string;
    work_spaces_used: boolean;
    // stats: AnalysisStats;
}

export interface AnalysisStats {
    number_of_transitive_dependencies: number;
    number_of_direct_dependencies: number;
}

export interface ParsedGitUrl {
    protocol: string;
    host: string;
    repo: string;
    user: string;
    project: string;
    repo_full_path: string;
    version: string;
    host_type: string;
}

export interface PublicError {
    key: string;
    description: string;
}

export interface PrivateError {
    key: string;
    description: string;
}

export interface ParsedGitUrl {
    protocol: string;
    host: string;
    repo: string;
    user: string;
    project: string;
    repo_full_path: string;
    version: string;
    host_type: string;
}

export interface TreeNode {
    data: Dependency | null;
    dependencies: TreeNode[];
}

export interface FlatTreeNode {
    pruned: boolean;
    data: Dependency | null;
    level: number;
    count: number;
    last: boolean;
    root: boolean;
    fencesToDraw: number[];
    parentPath: string;
    isDev: boolean;
}

export interface GetTreeOptions {
    includeDev: boolean;
}

export class DependencyTreeManager {
    dependencyTreeGenerator: DependencyTreeGenerator;
    graph: Graph | null;
    filterConfig: Partial<FilterConfig> | undefined;
    oldTree: TreeNode | null;
    flatTree: Array<FlatTreeNode>;
    paginationConfig: PaginationConfig;
    debugTimings: boolean;
    treeSize: number;
    includeDev: boolean;
    matchingCount: number;
    currentPage: number;
    returnedCount: number;
    fullCount: number;

    constructor(graph: Graph, debugTimings: boolean = false) {
        this.dependencyTreeGenerator = new DependencyTreeGenerator();
        this.graph = null;
        this.oldTree = null;
        this.flatTree = new Array<FlatTreeNode>();
        this.treeSize = 0;
        this.includeDev = true;
        this.filterConfig = {};
        this.paginationConfig = {
            apply: true,
            entriesPerPage: 200
        };
        this.graph = graph;
        this.debugTimings = debugTimings;
        this.matchingCount = 0;
        this.currentPage = 0;
        this.returnedCount = 0;
        this.fullCount = 0;
    }

    /**
     * Get a dependency tree from the graph structure generated by the sbom service
     * @param paginationConfig A pagination config that allows you to control the pagination (`Optional`)
     * @param filterConfig A filter config that defines the filters to apply to the dependencies in the tree. (`Optional`)
     * @param includeDev Whether or not to include dev dependencies in the tree (`Optional` defaults to `true`)
     * @throws Throws any error encountered. Be sure to catch them!
     * @returns A flat representation of the tree
     */
    getTree(
        paginationConfig?: PaginationConfig,
        filterConfig?: Partial<FilterConfig>,
        { includeDev = false }: Partial<GetTreeOptions> = {}
    ): [Array<FlatTreeNode>, PaginationInfo] {
        let start = null;
        let end = null;
        this.paginationConfig = paginationConfig || this.paginationConfig;
        this.includeDev = includeDev;

        let root = this.oldTree;
        if (this.filterConfig != filterConfig && this.graph) {
            this.matchingCount = 0;
            if (this.debugTimings) start = Date.now();
            this.dependencyTreeGenerator.fullCount = 0;
            const dependencies: Dependency[] = this.dependencyTreeGenerator.filterGraph(
                this.graph,
                includeDev,
                filterConfig
            );
            if (this.debugTimings) end = Date.now();
            if (this.debugTimings && end && start) console.log(`Filtering took ${end - start} ms`);

            if (this.debugTimings) start = Date.now();
            root = this.dependencyTreeGenerator.constructTree(dependencies, this.graph);
            this.oldTree = root;
            if (this.debugTimings) end = Date.now();
            if (this.debugTimings && end && start)
                console.log(`Construction took ${end - start} ms`);

            if (this.debugTimings) start = Date.now();
            this.dependencyTreeGenerator.removeCycles(root);
            if (this.debugTimings) end = Date.now();
            if (this.debugTimings && end && start) console.log(`Uncycling took ${end - start} ms`);
        }

        this.filterConfig = filterConfig;

        if (root) {
            if (this.debugTimings) start = Date.now();
            const [flatTree, fullCount]: [Array<FlatTreeNode>, number] =
                this.dependencyTreeGenerator.paginateTree(
                    root,
                    paginationConfig || this.paginationConfig,
                    this.currentPage,
                    true
                );
            if (this.debugTimings) end = Date.now();
            if (this.debugTimings && end && start) console.log(`Pagination took ${end - start} ms`);
            this.flatTree = flatTree;
            this.returnedCount = flatTree.length;
            this.treeSize = fullCount;
            this.matchingCount = fullCount;
        }

        return [
            this.flatTree,
            {
                currentPage: this.currentPage,
                totalPages: Math.ceil(this.treeSize / this.paginationConfig.entriesPerPage),
                matchingPagesCount: Math.ceil(
                    this.matchingCount / this.paginationConfig.entriesPerPage
                ),
                matchingItemCount: this.matchingCount,
                returnedItemCount: this.returnedCount
            }
        ];
    }

    /**
     * Change to next page of the paginated tree.
     * @throws Throws any error encountered. Be sure to catch them!
     * @returns A flat representation of the tree
     */
    nextPage(): [Array<FlatTreeNode>, PaginationInfo] {
        if (this.paginationConfig) {
            this.currentPage = Math.min(
                this.currentPage + 1,
                Math.ceil(this.treeSize / this.paginationConfig.entriesPerPage)
            );
            return this.getTree(this.paginationConfig, this.filterConfig, {
                includeDev: this.includeDev
            });
        }
        return this.getTree(this.paginationConfig, this.filterConfig, {
            includeDev: this.includeDev
        });
    }

    /**
     * Change to previous page of the paginated tree.
     * @throws Throws any error encountered. Be sure to catch them!
     * @returns A flat representation of the tree
     */
    previousPage(): [Array<FlatTreeNode>, PaginationInfo] {
        if (this.paginationConfig) {
            this.currentPage = Math.max(this.currentPage - 1, 0);
            return this.getTree(this.paginationConfig, this.filterConfig, {
                includeDev: this.includeDev
            });
        }
        return this.getTree(this.paginationConfig, this.filterConfig, {
            includeDev: this.includeDev
        });
    }

    /**
     * Change the page of the paginated tree.
     * @throws Throws any error encountered. Be sure to catch them!
     * @returns A flat representation of the tree
     */
    page(page: number): [Array<FlatTreeNode>, PaginationInfo] {
        if (this.paginationConfig) {
            this.currentPage = Math.min(
                Math.max(page, 0),
                Math.ceil(this.treeSize / this.paginationConfig.entriesPerPage)
            );
            return this.getTree(this.paginationConfig, this.filterConfig, {
                includeDev: this.includeDev
            });
        }
        return this.getTree(this.paginationConfig, this.filterConfig, {
            includeDev: this.includeDev
        });
    }
}

class DependencyTreeGenerator {
    fullTree: TreeNode | null;
    fullCount: number;
    prunePaths: Set<string>;

    constructor() {
        this.fullTree = null;
        this.fullCount = 0;
        this.prunePaths = new Set<string>();
    }

    /**
     * Filters the full graph based on the given filter config
     * @param graph The full graph
     * @param includeDev Whether or not to add dev dependencies to the filtered graph (if they survive filtering)
     * @param filterConfig The filter config
     * @returns
     */
    filterGraph(
        graph: Graph,
        includeDev: boolean,
        filterConfig?: Partial<FilterConfig>
    ): Dependency[] {
        const queue: Array<string> = [];
        const processed: Set<string> = new Set();
        const toPurge: Set<string> = new Set();

        for (const startDep of graph.start_deps) {
            if (!queue.includes(startDep)) queue.push(startDep);
        }

        if (includeDev) {
            for (const startDep of graph.start_dev_deps) {
                if (!queue.includes(startDep)) queue.push(startDep);
            }
        }

        while (queue.length > 0) {
            const depKey: string | undefined = queue.pop();
            if (depKey == undefined) continue;
            const dependency: Dependency = graph.dependencies[depKey];

            if (dependency == undefined) continue;

            if (filterConfig) {
                let purge: boolean = false;

                // Generic search input filter
                if (filterConfig.searchKey && filterConfig.searchKey != '') {
                    const lowerCaseSearchKey = filterConfig.searchKey.toLocaleLowerCase();
                    if (!dependency.name.includes(lowerCaseSearchKey)) {
                        if (!dependency.key.includes(lowerCaseSearchKey)) {
                            if (!dependency.version.includes(filterConfig.searchKey)) {
                                if (
                                    !dependency.licenses ||
                                    !dependency.licenses.find(
                                        (license) => license.toLowerCase() == lowerCaseSearchKey
                                    )
                                ) {
                                    if (
                                        !dependency.non_spdx_licenses ||
                                        !dependency.non_spdx_licenses.find(
                                            (vuln) => vuln.toLowerCase() == lowerCaseSearchKey
                                        )
                                    ) {
                                        if (
                                            !dependency.vulnerabilities ||
                                            !dependency.vulnerabilities.find(
                                                (vuln) => vuln.toLowerCase() == lowerCaseSearchKey
                                            )
                                        ) {
                                            purge = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Specific search filters
                if (filterConfig.directDepKey && !purge && filterConfig.directDepKey != '') {
                    if (dependency.parents.length == 0) {
                        if (dependency.key != filterConfig.directDepKey) {
                            purge = true;
                        }
                    }
                }

                if (
                    filterConfig.transitiveDepKey &&
                    !purge &&
                    filterConfig.transitiveDepKey != ''
                ) {
                    if (dependency.parents.length == 0) {
                        if (dependency.key != filterConfig.transitiveDepKey) {
                            purge = true;
                        }
                    }
                }

                if (filterConfig.licenseId && !purge && filterConfig.licenseId != '') {
                    const lowerCaseLicenseId = filterConfig.licenseId.toLowerCase();
                    if (
                        !dependency.licenses.find(
                            (license) => license.toLowerCase() == lowerCaseLicenseId
                        )
                    ) {
                        if (
                            !dependency.non_spdx_licenses.find(
                                (license) => license.toLowerCase() == lowerCaseLicenseId
                            )
                        ) {
                            purge = true;
                        }
                    }
                }

                // Vulnerability severity filter
                if (
                    filterConfig.vulnereabilitySeverity &&
                    !purge &&
                    !filterConfig.vulnereabilitySeverity.includes('NO_FILTER') &&
                    filterConfig.vulnereabilitySeverity.length != 0
                ) {
                    const purgeCombined = [];
                    if (filterConfig.vulnereabilitySeverity.includes('Critical')) {
                        purgeCombined.push(dependency.severity_dist.critical == 0);
                    }
                    if (filterConfig.vulnereabilitySeverity.includes('High')) {
                        purgeCombined.push(dependency.severity_dist.high == 0);
                    }
                    if (filterConfig.vulnereabilitySeverity.includes('Medium')) {
                        purgeCombined.push(dependency.severity_dist.medium == 0);
                    }
                    if (filterConfig.vulnereabilitySeverity.includes('Low')) {
                        purgeCombined.push(dependency.severity_dist.low == 0);
                    }
                    if (filterConfig.vulnereabilitySeverity.includes('None')) {
                        purgeCombined.push(dependency.severity_dist.none == 0);
                    }
                    if (purgeCombined.every((value) => value == true)) purge = true;
                }

                // Dependency Health filter
                if (
                    filterConfig.dependencyHealth &&
                    !purge &&
                    !filterConfig.dependencyHealth.includes('NO_FILTER') &&
                    filterConfig.dependencyHealth.length != 0
                ) {
                    const purgeCombined = [];
                    if (filterConfig.dependencyHealth.includes('Deprecated')) {
                        purgeCombined.push(!dependency.deprecated);
                    }
                    if (filterConfig.dependencyHealth.includes('Outdated')) {
                        purgeCombined.push(!dependency.outdated);
                    }
                    if (filterConfig.dependencyHealth.includes('Unlicensed')) {
                        purgeCombined.push(dependency.licenses.length > 0);
                    }
                    if (purgeCombined.every((value) => value == true)) purge = true;
                }

                // Vulnerability status filter
                if (
                    filterConfig.vulnereabilityStatus &&
                    !purge &&
                    filterConfig.vulnereabilityStatus != 'NO_FILTER'
                ) {
                    if (filterConfig.vulnereabilityStatus == 'Vulnerable') {
                        if (!dependency.vulnerable) purge = true;
                    } else if (filterConfig.vulnereabilityStatus == 'NotVulnerable') {
                        if (dependency.vulnerable) purge = true;
                    }
                }

                // Vulnerability Patchable filter
                if (
                    filterConfig.patchableStatus &&
                    !purge &&
                    !filterConfig.patchableStatus.includes('NO_FILTER') &&
                    filterConfig.patchableStatus.length != 0
                ) {
                    const purgeCombined = [];
                    if (filterConfig.patchableStatus.includes('FullyPatchable')) {
                        purgeCombined.push(dependency.patch_type != PatchType.FULL);
                    }
                    if (filterConfig.patchableStatus.includes('PartiallyPatchable')) {
                        purgeCombined.push(dependency.patch_type != PatchType.PARTIAL);
                    }
                    if (filterConfig.patchableStatus.includes('NotPatchable')) {
                        purgeCombined.push(dependency.patch_type != PatchType.NONE);
                    }
                    if (purgeCombined.every((value) => value == true)) purge = true;
                }

                if (purge) {
                    toPurge.add(dependency.key);
                }
            }

            processed.add(depKey);

            for (const child of dependency.dependencies) {
                if (!processed.has(child)) queue.push(child);
            }
        }

        const dependencies: Array<Dependency> = [];

        for (const dependency of processed) {
            if (!toPurge.has(dependency)) dependencies.push(graph.dependencies[dependency]);
        }

        return dependencies;
    }

    /**
     * Constructs a tree from a graph (bottom-to-top)
     * NOTE: this tree will contain cycles, it needs to be post processed!
     * @param startNodes The dependencies that survived the filtering
     * @param graph The full graph
     * @returns The root node
     */
    constructTree(startNodes: Dependency[], graph: Graph): TreeNode {
        const depsMap: Map<string, TreeNode> = new Map();
        const queue: Array<Dependency> = [];

        queue.push(...startNodes);

        const rootNode: TreeNode = {
            data: null,
            dependencies: []
        };

        while (queue.length > 0) {
            const dep: Dependency | undefined = queue.pop();

            if (dep == undefined) {
                continue;
            }

            let treeNode: TreeNode | undefined = depsMap.get(dep.key);

            if (treeNode == undefined) {
                const node: TreeNode = {
                    data: dep,
                    dependencies: []
                };
                depsMap.set(dep.key, node);
                treeNode = node;
            }

            if (treeNode.data && treeNode.data.is_transitive_count > 0) {
                for (const parentKey of treeNode.data.parents) {
                    let parent: TreeNode | undefined = depsMap.get(parentKey);
                    if (parent == undefined) {
                        parent = {
                            data: graph.dependencies[parentKey],
                            dependencies: []
                        };
                        depsMap.set(parentKey, parent);
                    }
                    if (parent.data && !parent.dependencies.includes(treeNode)) {
                        parent.dependencies.push(treeNode);
                        queue.push(parent.data);
                    }
                }
            }

            if (treeNode.data && treeNode.data.is_direct_count > 0) {
                if (!rootNode.dependencies.includes(treeNode)) {
                    rootNode.dependencies.push(treeNode);
                }
            }
        }

        return rootNode;
    }

    /**
     * Removes cyclces from a tree
     * @param node The current node to process (at the start should be the root node)
     * @returns nothing, modifies tree in place
     */
    removeCycles(node: TreeNode) {
        const prunePaths: Set<string> = new Set<string>();
        this.prunePaths = prunePaths;
        const encounteredDepsMap: { [key: string]: number } = {};

        function recurse(
            isRoot: boolean,
            node: TreeNode,
            parent: TreeNode | null,
            path: string[],
            prunePaths: Set<string>
        ) {
            if (isRoot == false && node.data && path.includes(node.data.key)) {
                if (parent != null) {
                    const index = parent.dependencies.indexOf(node);
                    if (index > -1) {
                        parent.dependencies.splice(index, 1);
                    }
                }
                return;
            }

            if (isRoot == false && node.data) path.push(node.data.key);

            if (node.data && node.data.key in encounteredDepsMap) {
                encounteredDepsMap[node.data.key] = encounteredDepsMap[node.data.key] + 1;
                prunePaths.add(path.join(' > '));
            } else if (node.data && !(node.data.key in encounteredDepsMap)) {
                encounteredDepsMap[node.data.key] = 1;
            }

            for (const child of node.dependencies) {
                recurse(false, child, node, path, prunePaths);
            }
            if (isRoot == false && node.data) path.pop();
        }

        recurse(true, node, null, [], prunePaths);
        this.prunePaths = prunePaths;
    }

    /**
     * Paginates the tree and also uncycles the tree!
     * Doing these together is much more performant than seperately, i.e. uncycle and then paginate.
     * @param tree The root not of the fully constructed tree / filtered tree
     * @param paginationConfig Pagination configuration
     * @param prune Whether or not to prune the tree of often apearing dependencies
     * @returns Flat representation of the tree
     */
    paginateTree(
        tree: TreeNode,
        paginationConfig: PaginationConfig,
        currentPage: number,
        prune: boolean
    ): [Array<FlatTreeNode>, number] {
        console.log(prune);

        const flatNodeArray: Array<FlatTreeNode> = [];

        const startIndex: number = currentPage * paginationConfig.entriesPerPage;
        const stopIndex: number = (currentPage + 1) * paginationConfig.entriesPerPage - 1;

        const prunePaths: Set<string> = this.prunePaths;

        const levelMap: { [key: string]: { [key: number]: number } } = {};

        function recurse(
            node: TreeNode,
            path: string[],
            root: boolean,
            counter: Counter,
            fullCounter: Counter,
            doFullCount: boolean,
            levelMap: { [key: string]: { [key: number]: number } }
        ): FlatTreeNode | null {
            const pathBefore = [...path];
            if (root == false && node.data) path.push(node.data.key);
            const pathString = path.join('|');
            const pruned = prunePaths.has(path.join(' > '));
            let isDev = false;
            if (node.data && node.data.is_dev_count > 0) {
                isDev = true;
            }

            if (counter.count >= stopIndex) {
                fullCounter.count += 1;
                if (root == false && node.data) {
                    if (doFullCount && !pruned) {
                        for (const child of node.dependencies) {
                            recurse(
                                child,
                                path,
                                false,
                                counter,
                                fullCounter,
                                doFullCount,
                                levelMap
                            ); // continue recursing (we need a full count of the non-cyclic tree)
                        }
                    } else {
                        if (root == false) path.pop();
                        return null;
                    }
                }
                if (root == false) path.pop();
                return null;
            }

            const flatNode: FlatTreeNode = {
                pruned: pruned,
                data: node.data,
                level: path.length,
                count: 1,
                last: false,
                root: root,
                fencesToDraw: [],
                parentPath: pathBefore.join('|'),
                isDev: isDev
            };

            if (levelMap[pathString] == undefined) {
                levelMap[pathString] = {};
            }

            levelMap[pathString][flatNode.level] = flatNodeArray.length - 1;
            if (flatNode.root) {
                levelMap[pathString][flatNode.level] = 0;
            }

            if (counter.count >= startIndex && counter.count <= stopIndex) {
                flatNodeArray.push(flatNode);
            }
            fullCounter.count += 1;
            counter.count += 1;
            const before = counter.count;

            let lastChild = null;

            if (!pruned) {
                for (const child of node.dependencies) {
                    const flat = recurse(
                        child,
                        path,
                        false,
                        counter,
                        fullCounter,
                        doFullCount,
                        levelMap
                    );
                    if (flat != null) lastChild = flat;
                }
            }

            if (root == false) path.pop();

            if (lastChild) lastChild.last = true;

            flatNode.count = counter.count - before + 1;

            return flatNode;
        }
        const fullCounter: Counter = { count: 0 };
        const matchingCounter: Counter = { count: 0 };

        try {
            recurse(tree, [], true, matchingCounter, fullCounter, this.fullCount == 0, levelMap);
            if (this.fullCount == 0) {
                this.fullCount = fullCounter.count;
            }
        } catch (error) {
            console.error(error);
        }

        const map = Object.values(levelMap);
        const difference = currentPage * paginationConfig.entriesPerPage;

        for (let i = 0; i < map.length; i++) {
            const currentNode = map[i];
            const [xCurrent, yCurrent] = Object.entries(currentNode)[0];
            if (yCurrent == -1 || (yCurrent == 0 && currentPage != 0)) {
                continue;
            }

            let nextNodeLevel = xCurrent;

            for (let j = 0; j < map.length; j++) {
                const testedNode = map[j];
                const [xTest] = Object.entries(testedNode)[0];
                if (i == j) {
                    flatNodeArray[i - difference].fencesToDraw.push(Number(xTest));
                } else if (i < j && xTest < xCurrent && xTest < nextNodeLevel) {
                    nextNodeLevel = xTest;
                    flatNodeArray[i - difference].fencesToDraw.push(Number(xTest));
                }
            }
        }

        return [flatNodeArray, this.fullCount];
    }
}
