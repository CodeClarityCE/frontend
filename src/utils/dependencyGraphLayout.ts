import type { Edge, Node } from "@vue-flow/core";
import * as d3 from "d3";

import type { GraphDependency } from "@/codeclarity_components/results/graph.entity";

export interface DependencyNodeData {
  label: string;
  packageName: string;
  version: string;
  isProd: boolean;
  isDev: boolean;
  isTarget: boolean;
  isPruned: boolean;
  isVirtualRoot: boolean;
  depth: number;
}

interface ExpandedNode extends GraphDependency {
  uniqueId: string;
}

/**
 * Convert a flat array of GraphDependency into Vue Flow nodes and edges
 * using D3's tree layout for position computation.
 *
 * Preserves the deduplication/pruning logic from the original TreeChart.vue:
 * - Creates unique node instances for each parent-child relationship
 * - Marks duplicate nodes at deeper levels as "pruned"
 * - Never prunes the target dependency
 */
export function layoutDependencyGraph(
  data: GraphDependency[],
  targetDependency?: string,
): { nodes: Node<DependencyNodeData>[]; edges: Edge[] } {
  if (!data || data.length === 0) {
    return { nodes: [], edges: [] };
  }

  // 1. Build node map for quick lookup
  const nodeMap = new Map<string, GraphDependency>();
  data.forEach((node) => nodeMap.set(node.id, node));

  // 2. Expand nodes — create unique instances for each parent-child relationship
  const expandedNodes: ExpandedNode[] = [];
  const processedRelationships = new Set<string>();

  for (const node of data) {
    if (!node.parentIds || node.parentIds.length === 0) {
      // Root node
      expandedNodes.push({ ...node, uniqueId: node.id, parentIds: [] });
      continue;
    }

    const parentCount = node.parentIds.length;
    for (let i = 0; i < parentCount; i++) {
      const parentId = node.parentIds[i];
      if (!parentId) continue;

      const relationshipKey = `${parentId}->${node.id}`;
      if (processedRelationships.has(relationshipKey)) continue;

      const uniqueId = parentCount > 1 ? `${node.id}_instance_${i}` : node.id;

      expandedNodes.push({
        ...node,
        uniqueId,
        parentIds: [parentId],
        childrenIds: node.childrenIds ?? [],
      });
      processedRelationships.add(relationshipKey);
    }
  }

  // 3. Update child references to point to unique instances
  const updatedNodes = expandedNodes.map((node) => {
    if (!node.childrenIds || node.childrenIds.length === 0) return node;

    const updatedChildren: string[] = [];
    for (const childId of node.childrenIds) {
      const childInstances = expandedNodes.filter(
        (expanded) =>
          expanded.id === childId && expanded.parentIds?.includes(node.id),
      );
      if (childInstances.length > 0) {
        updatedChildren.push(...childInstances.map((ci) => ci.uniqueId));
      } else {
        updatedChildren.push(childId);
      }
    }
    return { ...node, childrenIds: updatedChildren };
  });

  // 4. Build D3 hierarchy via stratify
  let root;
  try {
    root = d3
      .stratify<ExpandedNode>()
      .id((d) => d.uniqueId)
      .parentId((d) => {
        if (d.parentIds && d.parentIds.length > 0) {
          const parentId = d.parentIds[0];
          const parentNode = updatedNodes.find((n) => n.id === parentId);
          return parentNode ? parentNode.uniqueId : parentId;
        }
        return null;
      })(updatedNodes);
  } catch (e) {
    console.error("Failed to stratify dependency graph:", e);
    return { nodes: [], edges: [] };
  }

  // 5. Detect pruned nodes via BFS (keep first occurrence, prune duplicates at deeper levels)
  const prunedNodes = new Set<string>();
  const seenNodeIds = new Set<string>();
  const nodesByDepth = new Map<
    number,
    { nodeId: string; uniqueId: string }[]
  >();

  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const depth = current.depth;

    if (!nodesByDepth.has(depth)) nodesByDepth.set(depth, []);
    nodesByDepth.get(depth)!.push({
      nodeId: current.data.id,
      uniqueId: current.data.uniqueId,
    });

    if (current.children) queue.push(...current.children);
  }

  const sortedDepths = Array.from(nodesByDepth.keys()).sort((a, b) => a - b);
  for (const depth of sortedDepths) {
    for (const { nodeId, uniqueId } of nodesByDepth.get(depth)!) {
      if (seenNodeIds.has(nodeId)) {
        // Never prune the target dependency
        if (nodeId !== targetDependency) {
          prunedNodes.add(uniqueId);
        }
      } else {
        seenNodeIds.add(nodeId);
      }
    }
  }

  // 6. Apply D3 tree layout
  const dx = 80;
  const dy = 260;

  const treeLayout = d3.tree<ExpandedNode>().nodeSize([dx, dy]);

  root.sort((a, b) => {
    if (a.data.id === "__VIRTUAL_ROOT__") return -1;
    if (b.data.id === "__VIRTUAL_ROOT__") return 1;
    if (a.data.prod && !b.data.prod) return -1;
    if (!a.data.prod && b.data.prod) return 1;
    if (a.data.dev && !b.data.dev) return -1;
    if (!a.data.dev && b.data.dev) return 1;
    return (a.data.id ?? "").localeCompare(b.data.id ?? "");
  });

  treeLayout(root);

  // 7. Convert to Vue Flow nodes
  const vfNodes: Node<DependencyNodeData>[] = [];

  root.each((d) => {
    const isTarget =
      targetDependency !== undefined && d.data.id === targetDependency;
    const isPruned = prunedNodes.has(d.data.uniqueId);
    const isVirtualRoot = d.data.id === "__VIRTUAL_ROOT__";

    // Parse package name and version from id (format: "name@version")
    let packageName = d.data.id;
    let version = "";
    if (!isVirtualRoot) {
      const atIndex = d.data.id.lastIndexOf("@");
      if (atIndex > 0) {
        packageName = d.data.id.substring(0, atIndex);
        version = d.data.id.substring(atIndex + 1);
      }
    }

    vfNodes.push({
      id: d.data.uniqueId,
      type: "dependency",
      // D3 tree: x = vertical position, y = horizontal position
      // Vue Flow: x = horizontal, y = vertical
      position: { x: d.y ?? 0, y: d.x ?? 0 },
      data: {
        label: d.data.id,
        packageName,
        version,
        isProd: d.data.prod ?? false,
        isDev: d.data.dev ?? false,
        isTarget,
        isPruned,
        isVirtualRoot,
        depth: d.depth,
      },
    });
  });

  // 8. Convert to Vue Flow edges
  const vfEdges: Edge[] = [];

  root.links().forEach((link, index) => {
    const sourceId = link.source.data.uniqueId;
    const targetId = link.target.data.uniqueId;
    const isTargetPath =
      targetDependency !== undefined &&
      (link.source.data.id === targetDependency ||
        link.target.data.id === targetDependency);

    vfEdges.push({
      id: `edge-${sourceId}-${targetId}-${index}`,
      source: sourceId,
      target: targetId,
      type: "smoothstep",
      animated: isTargetPath,
      style: {
        stroke: isTargetPath ? "#f59e0b" : "#94a3b8",
        strokeWidth: isTargetPath ? 3 : 1.5,
        opacity: isTargetPath ? 0.9 : 0.5,
      },
    });
  });

  return { nodes: vfNodes, edges: vfEdges };
}
