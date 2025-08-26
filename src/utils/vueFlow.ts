import type { Plugin } from '@/codeclarity_components/organizations/analyzers/Plugin';
import type { Node, Edge } from '@vue-flow/core';
import { Position } from '@vue-flow/core';
import * as d3 from 'd3';

export interface AnalyzerNode extends Node {
    type: 'analyzer';
    data: {
        label: string;
        plugin: Plugin;
        version: string;
        description: string;
        stage?: number;
        config?: any;
    };
    selectable?: boolean;
    deletable?: boolean;
    selected?: boolean;
}

export interface ConfigNode extends Node {
    type: 'config';
    data: {
        label: string;
        configKey: string;
        configType: string;
        value: any;
    };
}

export function getColor(name: string): string {
    const color = d3.scaleSequential().domain([1, 10]).interpolator(d3.interpolateViridis);

    let code = 0;
    for (let i = 0; i < name.length; i++) {
        code += name.charCodeAt(i);
    }
    code = code % 10;

    return color(code);
}

export function getWidth() {
    return document.querySelector('#form')?.clientWidth ?? 0;
}

export function createAnalyzerNodes(plugins: Plugin[]): {
    nodes: (AnalyzerNode | ConfigNode)[];
    edges: Edge[];
} {
    const nodes: (AnalyzerNode | ConfigNode)[] = [];
    const edges: Edge[] = [];
    const nodeMap = new Map<string, string>(); // plugin name -> node id

    // Create analyzer nodes
    plugins.forEach((plugin) => {
        if (plugin.name.includes('notifier')) {
            return;
        }

        const nodeId = `analyzer-${plugin.name}`;
        nodeMap.set(plugin.name, nodeId);

        const analyzerNode: AnalyzerNode = {
            id: nodeId,
            type: 'analyzer',
            position: { x: 0, y: 0 }, // Will be positioned by layoutNodes
            data: {
                label: plugin.name,
                plugin,
                version: plugin.version,
                description: plugin.description
            },
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
            style: {
                backgroundColor: 'black',
                color: 'white',
                border: '1px solid #374151',
                borderRadius: '8px',
                padding: '10px',
                minWidth: '150px'
            }
        };

        nodes.push(analyzerNode);
    });

    // Create dependency edges between analyzer nodes
    plugins.forEach((plugin) => {
        if (plugin.name.includes('notifier')) {
            return;
        }

        const targetNodeId = nodeMap.get(plugin.name);
        if (!targetNodeId) return;

        plugin.depends_on.forEach((dependency, index) => {
            const sourceNodeId = nodeMap.get(dependency);
            if (sourceNodeId) {
                edges.push({
                    id: `edge-${sourceNodeId}-${targetNodeId}-${index}`,
                    source: sourceNodeId,
                    target: targetNodeId,
                    sourceHandle: dependency, // The source handle ID equals the source plugin name
                    targetHandle: dependency, // Connect to the target node's input handle for this dependency
                    style: {
                        stroke: 'black',
                        strokeWidth: 3
                    },
                    type: 'smoothstep',
                    animated: true
                });
            }
        });
    });

    return { nodes, edges };
}

export function createEdgesFromNodes(analyzerNodes: AnalyzerNode[]): Edge[] {
    const edges: Edge[] = [];
    const nodeMap = new Map<string, string>();

    // Build node map
    analyzerNodes.forEach((node) => {
        nodeMap.set(node.data.plugin.name, node.id);
    });

    // Create dependency edges between analyzer nodes
    analyzerNodes.forEach((node) => {
        const plugin = node.data.plugin;
        const targetNodeId = node.id;

        plugin.depends_on.forEach((dependency, index) => {
            const sourceNodeId = nodeMap.get(dependency);
            if (sourceNodeId) {
                edges.push({
                    id: `edge-${sourceNodeId}-${targetNodeId}-${index}`,
                    source: sourceNodeId,
                    target: targetNodeId,
                    sourceHandle: dependency, // The source handle ID equals the source plugin name
                    targetHandle: dependency, // Connect to the target node's input handle for this dependency
                    style: {
                        stroke: 'black',
                        strokeWidth: 3
                    },
                    type: 'smoothstep',
                    animated: true
                });
            }
        });
    });

    return edges;
}

export function retrieveWorkflowSteps(
    nodes: (AnalyzerNode | ConfigNode)[],
    edges: Edge[]
): any[][] {
    const analyzerNodes = nodes.filter((node): node is AnalyzerNode => node.type === 'analyzer');
    const dependencyMap = new Map<string, string[]>();

    // Build dependency map from edges
    edges.forEach((edge) => {
        const sourceNode = analyzerNodes.find((n) => n.id === edge.source);
        const targetNode = analyzerNodes.find((n) => n.id === edge.target);

        if (sourceNode && targetNode) {
            const targetName = targetNode.data.plugin.name;
            const sourceName = sourceNode.data.plugin.name;

            if (!dependencyMap.has(targetName)) {
                dependencyMap.set(targetName, []);
            }
            dependencyMap.get(targetName)!.push(sourceName);
        }
    });

    // Calculate depth for each node
    const getDepth = (pluginName: string, visited = new Set<string>()): number => {
        if (visited.has(pluginName)) return 0; // Circular dependency protection
        visited.add(pluginName);

        const dependencies = dependencyMap.get(pluginName) || [];
        let maxDepth = 0;

        for (const dep of dependencies) {
            maxDepth = Math.max(maxDepth, getDepth(dep, new Set(visited)) + 1);
        }

        return maxDepth;
    };

    // Group nodes by depth
    const depthMap = new Map<number, any[]>();

    analyzerNodes.forEach((node) => {
        const depth = getDepth(node.data.plugin.name);

        if (!depthMap.has(depth)) {
            depthMap.set(depth, []);
        }

        depthMap.get(depth)!.push({
            name: node.data.plugin.name,
            version: node.data.version,
            config: node.data.plugin.config
        });
    });

    // Convert to array format
    const maxDepth = Math.max(...depthMap.keys());
    const result: any[][] = [];

    for (let i = 0; i <= maxDepth; i++) {
        result.push(depthMap.get(i) || []);
    }

    return result.filter((step) => step.length > 0);
}

export function layoutNodes(nodes: (AnalyzerNode | ConfigNode)[]): (AnalyzerNode | ConfigNode)[] {
    const analyzerNodes = nodes.filter((node): node is AnalyzerNode => node.type === 'analyzer');

    // Build dependency map for topological sorting
    const dependencyMap = new Map<string, string[]>();
    const reverseDeps = new Map<string, string[]>();

    analyzerNodes.forEach((node) => {
        const name = node.data.plugin.name;
        const deps = node.data.plugin.depends_on.filter((dep) =>
            analyzerNodes.some((n) => n.data.plugin.name === dep)
        );

        dependencyMap.set(name, deps);

        // Build reverse dependency map
        deps.forEach((dep) => {
            if (!reverseDeps.has(dep)) {
                reverseDeps.set(dep, []);
            }
            reverseDeps.get(dep)!.push(name);
        });
    });

    // Layout in clean left-to-right flow with generous spacing
    const columnWidth = 500; // More horizontal space between levels
    const rowHeight = 300; // More vertical space between nodes
    const startX = 150; // Start further from left edge
    const startY = 200; // Start lower to give more space above

    // Group nodes by their position in the dependency chain
    const levels = new Map<number, AnalyzerNode[]>();
    const nodeToLevel = new Map<string, number>();

    // Calculate dependency levels - nodes with no dependencies are level 0
    const calculateLevel = (nodeName: string): number => {
        if (nodeToLevel.has(nodeName)) {
            return nodeToLevel.get(nodeName)!;
        }

        const deps = dependencyMap.get(nodeName) || [];

        // If no dependencies, this is a root node (level 0)
        if (deps.length === 0) {
            nodeToLevel.set(nodeName, 0);
            return 0;
        }

        // Otherwise, level is 1 + max level of dependencies
        let maxDepLevel = -1;
        for (const dep of deps) {
            maxDepLevel = Math.max(maxDepLevel, calculateLevel(dep));
        }

        const level = maxDepLevel + 1;
        nodeToLevel.set(nodeName, level);
        return level;
    };

    // Calculate levels for all nodes
    analyzerNodes.forEach((node) => {
        const level = calculateLevel(node.data.plugin.name);
        if (!levels.has(level)) {
            levels.set(level, []);
        }
        levels.get(level)!.push(node);
    });

    // Position analyzer nodes - all nodes at same level get same X coordinate
    levels.forEach((nodesAtLevel, level) => {
        const x = startX + level * columnWidth;

        // Center nodes vertically if there are multiple at the same level
        const totalHeight = (nodesAtLevel.length - 1) * rowHeight;
        const startYForLevel = startY - totalHeight / 2;

        nodesAtLevel.forEach((node, index) => {
            node.position = {
                x: x, // Same X for all nodes at this level
                y: startYForLevel + index * rowHeight
            };
        });
    });

    return analyzerNodes;
}
