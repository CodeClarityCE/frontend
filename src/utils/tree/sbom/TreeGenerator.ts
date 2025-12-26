// Tree node data structure for SBOM visualization
export interface SeverityDistribution {
  critical: number;
  high: number;
  medium: number;
  low: number;
  none: number;
}

export interface NodeData {
  key: string;
  severity_dist?: SeverityDistribution;
  outdated?: boolean;
  outdatedMessage?: string;
  deprecated?: boolean;
  [key: string]: unknown;
}

export interface FlatTreeNode {
  key: string;
  level: number;
  fencesToDraw: number[];
  isDev: boolean;
  root: boolean;
  data?: NodeData;
  pruned?: boolean;
}

export interface TreeNode {
  key: string;
  data?: NodeData;
  children?: TreeNode[];
  isDev?: boolean;
}

// Tree generator utility functions
export class TreeGenerator {
  static flattenTree(
    node: TreeNode,
    level = 0,
    fencesToDraw: number[] = [],
  ): FlatTreeNode[] {
    const flatNodes: FlatTreeNode[] = [];

    const flatNode: FlatTreeNode = {
      key: node.key,
      level,
      fencesToDraw: [...fencesToDraw],
      isDev: node.isDev ?? false,
      root: level === 0,
      data: node.data,
      pruned: false,
    };

    flatNodes.push(flatNode);

    if (node.children) {
      node.children.forEach((child, index) => {
        const childFences = [...fencesToDraw];
        if (index < node.children!.length - 1) {
          childFences.push(level + 1);
        }

        const childNodes = this.flattenTree(child, level + 1, childFences);
        flatNodes.push(...childNodes);
      });
    }

    return flatNodes;
  }

  static generateFromData(): TreeNode[] {
    // This would be implemented based on the specific data structure
    // For now, return empty array to prevent errors
    return [];
  }
}

export default TreeGenerator;
