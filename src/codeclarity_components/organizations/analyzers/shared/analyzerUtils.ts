import { Position } from "@vue-flow/core";
import type { Plugin } from "@/codeclarity_components/organizations/analyzers/Plugin";
import type { AnalyzerNode } from "@/utils/vueFlow";

export interface AnalyzerFormData {
  name: string;
  description: string;
}

export interface AnalyzerSubmissionData extends AnalyzerFormData {
  steps: Record<string, unknown>[];
}

export interface TemplateStep {
  name: string;
  config?: Record<string, unknown>;
}

export function initializeDefaultNodes(
  plugins: Plugin[],
  templateSteps?: TemplateStep[][],
): AnalyzerNode[] {
  const defaultNodes: AnalyzerNode[] = [];

  // If template steps are provided, use them to create nodes
  if (templateSteps && templateSteps.length > 0) {
    templateSteps.forEach((stageSteps, stageIndex) => {
      if (Array.isArray(stageSteps)) {
        stageSteps.forEach((step) => {
          const plugin = plugins.find((p) => p.name === step.name);
          if (plugin) {
            const node = createAnalyzerNode(plugin);
            // Add stage information to the node
            node.data.stage = stageIndex;
            node.data.config = step.config ?? {};
            defaultNodes.push(node);
          }
        });
      }
    });
    return defaultNodes;
  }

  // Default behavior: Add SBOM plugin
  const sbomPlugin = plugins.find(
    (p) => p.name.includes("sbom") ?? p.name.includes("js-sbom"),
  );
  if (sbomPlugin) {
    defaultNodes.push(createAnalyzerNode(sbomPlugin));
  }

  // Add vulnerability plugin
  const vulnPlugin = plugins.find(
    (p) =>
      p.name.includes("vuln") ||
      p.name.includes("vulnerability") ||
      p.name.includes("vuln-finder"),
  );
  if (vulnPlugin) {
    defaultNodes.push(createAnalyzerNode(vulnPlugin));
  }

  return defaultNodes;
}

export function createAnalyzerNode(plugin: Plugin): AnalyzerNode {
  const nodeId = `analyzer-${plugin.name}`;

  return {
    id: nodeId,
    type: "analyzer",
    position: { x: 0, y: 0 }, // Will be positioned by layoutNodes
    data: {
      label: plugin.name,
      plugin: plugin,
      version: plugin.version,
      description: plugin.description,
    },
    targetPosition: Position.Left,
    sourcePosition: Position.Right,
    selectable: true,
    deletable: true,
  };
}

export function getAvailablePlugins(
  plugins: Plugin[],
  existingNodes: AnalyzerNode[],
): Plugin[] {
  const existingPluginNames = existingNodes.map((n) => n.data.plugin.name);

  return plugins.filter(
    (plugin) =>
      !existingPluginNames.includes(plugin.name) &&
      !plugin.name.includes("notifier"),
  );
}

export function addPluginWithDependencies(
  plugin: Plugin,
  plugins: Plugin[],
  existingNodes: AnalyzerNode[],
  processedPlugins = new Set<string>(),
): AnalyzerNode[] {
  // Avoid circular dependencies
  if (processedPlugins.has(plugin.name)) {
    return existingNodes;
  }
  processedPlugins.add(plugin.name);

  // Check if plugin is already added
  const existingPluginNames = existingNodes.map((n) => n.data.plugin.name);
  if (existingPluginNames.includes(plugin.name)) {
    return existingNodes;
  }

  let updatedNodes = [...existingNodes];

  // First, add all dependencies recursively
  plugin.depends_on.forEach((dependencyName) => {
    const dependencyPlugin = plugins.find((p) => p.name === dependencyName);
    if (dependencyPlugin) {
      updatedNodes = addPluginWithDependencies(
        dependencyPlugin,
        plugins,
        updatedNodes,
        new Set(processedPlugins),
      );
    }
  });

  // Then add the plugin itself
  const newNode = createAnalyzerNode(plugin);
  updatedNodes.push(newNode);

  return updatedNodes;
}
