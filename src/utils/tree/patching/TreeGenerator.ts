import type { TreeNode } from './TreeNode';

export interface PatchOccurenceInfo {
    affected_deps: string[];
    vulnerability_id: string;
    all_occurences: string[][];
    introduced_occurences: string[][];
    unpatched_occurences: string[][];
    patched_occurences: string[][];
    all_occurences_strings?: string[];
    introduced_occurences_strings?: string[];
    unpatched_occurences_strings?: string[];
    patched_occurences_strings?: string[];
}

export class TreeGenerator {
    generateTree(all_vulns: PatchOccurenceInfo[]): Array<TreeNode> {
        for (const vuln of all_vulns) {
            vuln.all_occurences_strings = [];
            vuln.introduced_occurences_strings = [];
            vuln.unpatched_occurences_strings = [];
            vuln.patched_occurences_strings = [];
            for (const occur of vuln.all_occurences) {
                vuln.all_occurences_strings.push(occur.join(','));
            }
            for (const occur of vuln.introduced_occurences) {
                vuln.introduced_occurences_strings.push(occur.join(','));
            }
            for (const occur of vuln.unpatched_occurences) {
                vuln.unpatched_occurences_strings.push(occur.join(','));
            }
            for (const occur of vuln.patched_occurences) {
                vuln.patched_occurences_strings.push(occur.join(','));
            }
        }

        let count: number = 0;
        const root: TreeNode = {
            parentPath: '',
            path: '',
            root: true,
            key: 'root',
            level: 0,
            lastOfLevel: true,
            count: 0,
            fencesToDraw: [],
            vulnerable: false,
            vulnerability_ids: [],
            patch_type: '',
            children: []
        };

        const map: { [key: string]: TreeNode } = { '': root };

        for (const vuln of all_vulns) {
            let pathIndex = 0;
            for (const path of vuln.all_occurences) {
                const commulative_path: string[] = [];
                for (const part of path) {
                    const before = [...commulative_path];
                    const parent_key = before.join('|');
                    commulative_path.push(part);
                    if (!(commulative_path.join('|') in map)) {
                        count += 1;
                        const node: TreeNode = {
                            parentPath: before.join('|'),
                            path: commulative_path.join('|'),
                            root: false,
                            key: part,
                            level: commulative_path.length,
                            lastOfLevel: false,
                            count: count,
                            fencesToDraw: [],
                            vulnerable: false,
                            vulnerability_ids: [],
                            patch_type: '',
                            children: []
                        };
                        if (
                            vuln.unpatched_occurences_strings!.includes(
                                vuln.all_occurences_strings![pathIndex]
                            ) &&
                            vuln.affected_deps.includes(node.key)
                        ) {
                            node.vulnerable = true;
                            node.vulnerability_ids.push(vuln.vulnerability_id);
                            node.patch_type = 'NONE';
                        }
                        if (
                            vuln.patched_occurences_strings!.includes(
                                vuln.all_occurences_strings![pathIndex]
                            ) &&
                            vuln.affected_deps.includes(node.key)
                        ) {
                            node.vulnerable = true;
                            node.vulnerability_ids.push(vuln.vulnerability_id);
                            node.patch_type = 'FULL';
                        }
                        if (
                            vuln.introduced_occurences_strings!.includes(
                                vuln.all_occurences_strings![pathIndex]
                            ) &&
                            vuln.affected_deps.includes(node.key)
                        ) {
                            node.vulnerable = true;
                            node.vulnerability_ids.push(vuln.vulnerability_id);
                            node.patch_type = 'NONE';
                        }
                        for (let i = 1; i <= commulative_path.length; i++) {
                            node.fencesToDraw.push(i);
                        }
                        map[commulative_path.join('|')] = node;
                        map[parent_key].children.push(node);
                    } else {
                        const node = map[commulative_path.join('|')];
                        if (
                            vuln.unpatched_occurences_strings!.includes(
                                vuln.all_occurences_strings![pathIndex]
                            ) &&
                            vuln.affected_deps.includes(node.key)
                        ) {
                            node.vulnerable = true;
                            node.vulnerability_ids.push(vuln.vulnerability_id);
                            node.patch_type = 'NONE';
                        }
                        if (
                            vuln.patched_occurences_strings!.includes(
                                vuln.all_occurences_strings![pathIndex]
                            ) &&
                            vuln.affected_deps.includes(node.key)
                        ) {
                            node.vulnerable = true;
                            node.vulnerability_ids.push(vuln.vulnerability_id);
                            node.patch_type = 'FULL';
                        }
                        if (
                            vuln.introduced_occurences_strings!.includes(
                                vuln.all_occurences_strings![pathIndex]
                            ) &&
                            vuln.affected_deps.includes(node.key)
                        ) {
                            node.vulnerable = true;
                            node.vulnerability_ids.push(vuln.vulnerability_id);
                            node.patch_type = 'NONE';
                        }
                        if (!map[parent_key].children.includes(node))
                            map[parent_key].children.push(node);
                    }
                }
                pathIndex++;
            }
        }

        const levelMap: { [key: string]: { [key: number]: number } } = {};

        function recurseBuildTree(
            parent: TreeNode,
            nodes: TreeNode[],
            levelMap: { [key: string]: { [key: number]: number } },
            path: string[]
        ) {
            nodes.push(parent);
            const path_string = path.join('|');

            if (levelMap[path_string] == undefined) {
                levelMap[path_string] = {};
            }

            levelMap[path_string][parent.level] = nodes.length - 1;

            if (parent.children.length > 0) {
                for (const child of parent.children) {
                    path.push(parent.key);
                    recurseBuildTree(child, nodes, levelMap, path);
                    path.pop();
                }
            }
        }

        const nodeArray: TreeNode[] = [];
        recurseBuildTree(root, nodeArray, levelMap, []);

        for (const [, subPath] of Object.entries(levelMap)) {
            for (const [, index] of Object.entries(subPath)) {
                const levelToFilter = nodeArray[index].level;
                const parentPath = nodeArray[index].parentPath;
                for (let i = index + 1; i < nodeArray.length; i++) {
                    if (nodeArray[i].parentPath.startsWith(parentPath)) {
                        nodeArray[i].fencesToDraw = nodeArray[i].fencesToDraw.filter(
                            (index) => index != levelToFilter
                        );
                    }
                }
            }
        }

        return nodeArray;
    }
}
