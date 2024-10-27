export interface TreeNode {
    root: boolean;
    key: string;
    level: number;
    lastOfLevel: boolean;
    fencesToDraw: number[];
    count: number;
    parentPath: string;
    path: string;
    vulnerable: boolean;
    vulnerability_ids: string[];
    patch_type: string;
    children: TreeNode[];
}
